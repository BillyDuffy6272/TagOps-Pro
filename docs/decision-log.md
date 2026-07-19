# Decision Log

A running log of significant technical and product decisions made on TagOps-Pro.

> **AT3 note.** The AT3 orientation calls this file `decisions.md`. The filename here is kept as `decision-log.md` per project preference, pending teacher confirmation. The content serves the same purpose: the "running decisions and trade-offs log" required by the folio.

Each entry follows a lightweight ADR (Architecture Decision Record) format:

- **Date** — when the decision was made.
- **Status** — Proposed / Accepted / Superseded / Reverted.
- **Context** — what problem or question prompted this decision.
- **Decision** — what was actually chosen.
- **Consequences** — trade-offs, follow-ups, things that became harder.

Add new entries to the top. Do not edit historical entries — supersede them with a new one.

---

## ADR-0021 — Native desktop app as an Electron shell in `desktop/`, with sign-in through the system browser

- **Date:** 2026-07-13
- **Status:** Accepted (extends ADR-0020; the PWA and web app remain unchanged)
- **Context:** After the PWA (ADR-0020), the user explicitly asked for "an application separate to a website". That's an off-mandate extra — the AT3 deliverable is still the Vercel web app — so the constraint was: add a true desktop target without disturbing the submission, without a second codebase, and without fighting Google's hard block on OAuth inside embedded app webviews (the `disallowed_useragent` error).
- **Decision:** A self-contained **Electron** shell in `desktop/` (own `package.json`; Electron chosen over Tauri because it needs no Rust toolchain and is the boring, heavily-documented option). Three deliberate design points: (1) The shell serves the *same built web app* (`dist/`, bundled as `resources/renderer` when packaged) over a private `tagops://` protocol registered as standard+secure — giving the renderer a real origin (so Supabase localStorage sessions work) without a local web server or `file://` quirks. (2) **Sign-in never happens inside the app window.** The renderer calls `signInWithOAuth` with `skipBrowserRedirect` and a `redirectTo` of `http://127.0.0.1:53682/auth/callback`; the main process opens that URL in the user's real browser and runs a one-shot loopback HTTP server that catches the returning `?code=`, which the renderer exchanges via `exchangeCodeForSession`. This required switching the shared Supabase client to the **PKCE flow** (`src/lib/supabase.ts`) — also the recommended flow for the web app, which keeps working identically. (3) The preload bridge exposes exactly one function (`window.desktopAuth.signIn`), keeping the renderer isolated from Node/IPC; all external navigation is forced out to the system browser. Packaging via electron-builder (`npm run desktop:package` → unsigned `TagOps Pro.app`, icon derived from the same favicon artwork). Electron pinned to ≥43 to clear all `npm audit` advisories.
- **Consequences:** One codebase, three delivery forms (web, PWA, desktop). **Setup requirement:** `http://127.0.0.1:53682/auth/callback` must be added to Supabase → Authentication → URL Configuration → Redirect URLs, or desktop sign-in will bounce. The desktop shell is not part of the AT3 submission and must be presented as an extra, not the deliverable. Known follow-ups: no Content-Security-Policy meta yet (Electron's dev-mode advisory; needs careful allow-listing of Supabase/Google endpoints before adding), the app is unsigned (fine for personal use; distribution would need an Apple Developer identity), and `desktop/` currently has no automated tests — the auth broker logic is small but a candidate for extraction if it grows.

---

## ADR-0020 — Installable PWA rather than a native desktop app

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** The user wanted TagOps-Pro to be "an application, not a website". A native desktop binary (Tauri/Electron) would deviate from the mandated stack — the AT3 deliverable is a working solution at a Vercel URL, and off-stack changes needed teacher approval by end of Week 3 — and would complicate Google OAuth. The actual need is the app *feeling* like an app: its own window, its own icon, no browser chrome.
- **Decision:** Made the app an installable PWA using only static assets: `public/manifest.webmanifest` (name, `display: standalone`, dark theme/background colours matching the canvas token, 192/512 `any` + 512 `maskable` icons) linked from `index.html` alongside `theme-color` and `apple-touch-icon`/status-bar metadata for iOS Add-to-Home-Screen. Icons were rasterised from the existing `favicon.svg` artwork composed onto the app's dark surface colour. **No service worker**: Chrome no longer requires one for installability, offline mode is meaningless for an app whose data is the live GTM API, and stale-cache bugs around the OAuth redirect are a real risk for zero benefit — revisit only if offline shell caching becomes a genuine requirement (via `vite-plugin-pwa`, not hand-rolled).
- **Consequences:** Chrome/Edge users get an install prompt (own window, dock/taskbar icon); iOS users can Add to Home Screen. Everything still ships as the same Vercel deployment — one codebase, no new dependencies, nothing to defend beyond a manifest. The `index.html` title was also corrected from the scaffold's `tagops-pro` to `TagOps Pro` since it becomes the installed app's window title.

---

## ADR-0019 — Preview mode as a local simulation, not a page-injected debugger; Vitest adopted for its tests

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** The user asked for "a preview mode like GTM". GTM's real preview works by injecting a debug script into the live site and observing actual page events — replicating that would mean writing to the user's site (or proxying it), which collides with this repo's tracking-platform safety rules (read-only by default, nothing touches production without explicit confirmation) and is far beyond MVP scope. The genuinely useful part of GTM preview for this product's audience (non-technical owners) is the *explanation*: which tags fire on which events, and why the rest didn't.
- **Decision:** Built preview as a pure client-side simulation (`src/features/preview/lib/simulator.ts` + `src/features/preview/components/`). It loads the container's real tags and triggers from the GTM API (read-only, cached), replays GTM's own page-load event sequence (`gtm.init_consent` → `gtm.init` → `gtm.js` → `gtm.dom` → `gtm.load`), and lets the user push simulated interactions (clicks, form submits, scroll, custom dataLayer events with a JSON payload). For each event it reports per-tag status — fired / not fired / paused / blocked — with the matching trigger named in the reason, plus a data-layer inspector. GTM's implicit triggers (All Pages `2147479553`, Initialization `2147479573`, Consent Init `2147479572`) are resolved from their fixed IDs since the API never returns them. Honesty rule baked in: trigger *conditions* ("Page URL contains /checkout") can't be evaluated without a real page, so they're surfaced as an explicit "N conditions not evaluated" caveat instead of silently guessed; the shallow data-layer merge is likewise called out in a comment. Because the simulator is dataLayer logic, CLAUDE.md's "datalayer code must have unit tests" rule applies — **Vitest** was installed (resolving the long-open testing-framework question for the unit tier; Playwright for smoke remains open) with 23 tests in `tests/unit/` covering trigger matching (incl. regex custom events and invalid-regex safety), built-in trigger resolution, pause/block precedence, and data-layer accumulation. `test`/`test:watch`/`typecheck` scripts added to `package.json`.
- **Consequences:** Preview can honestly answer "which tags *would* fire on this event" but not "does my site actually push this event" — that remains the roadmap "firing verification" feature, and the UI's framing ("events are simulated locally, no real hits are sent") keeps that distinction visible. The built-in trigger ID table and the trigger-type→event map are the two places that must grow if Google adds trigger types. Vitest is a new devDependency installed without a same-day ask (flagged for review); it was already the planned default in CLAUDE.md and the folio.

---

## ADR-0018 — Google Ads conversion tracking completed end-to-end in the UI

- **Date:** 2026-07-11
- **Status:** Accepted (closes the follow-up from ADR-0015)
- **Context:** ADR-0015/0016 added the schema and list UI for Google Ads conversions, but the loop was open: no screen could set a container's `google_ads_conversion_id` (the form pointed at a "container/settings screen" that didn't exist, so the ID could only be set directly in Supabase), the conversion label had no client-side validation, and after linking there was still nothing actionable — no way to get the tracking code onto a site.
- **Decision:** Three additions inside the existing conversions feature: (1) `GoogleAdsSettingsModal` opened from a status chip in the Conversions picker bar (green with the `AW-` ID when linked, amber "Link Google Ads" when not) that writes the ID via a new `updateContainerGoogleAdsId()` — validated client-side against the same `^AW-[0-9]{6,}$` pattern the migration's CHECK constraint enforces, so users get an actionable message instead of a raw 23514. (2) Conversion-label validation (`^[A-Za-z0-9_-]{4,}$`) in the event form. (3) A per-event "Code" action opening `ConversionSnippetModal`, which generates copyable tracking code from `src/features/conversions/lib/snippets.ts` in two flavours — the direct `gtag('event','conversion',{send_to:…})` call Google Ads' own setup flow hands out, and a `dataLayer.push` variant for GTM-owned pages — with real IDs when linked, clearly-marked placeholders plus a warning banner when not. Snippet generation is pure and unit-tested.
- **Consequences:** "Needs setup" states in the conversions list are now fixable inside the app instead of requiring database access. The snippet generator is the first place the app emits code for users to paste into *their* sites — it deliberately emits placeholders (`'value': 0, // TODO`) rather than guessing amounts, so a copy-paste without reading can't silently report wrong conversion values. A new stat ("Linked to Google Ads") makes the unlinked backlog visible at a glance.

---

## ADR-0017 — App-wide GTM selection context with a cached API layer; `set-state-in-effect` lint rule parked

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** All four GTM-backed views (Tags, Triggers, Variables, Conversions) carried a private copy of the same ~70 lines: fetch accounts, fetch containers, own the selection state, render the picker bar. Switching sidebar sections therefore refetched identical data every time *and* dropped the user's account/container choice — the most visible UX papercut in the app — while multiplying calls against the GTM API's per-minute quota.
- **Decision:** Selection now lives once in `GtmProvider` (`src/lib/GtmContext.tsx`, mounted in `AppShell`), and the picker bar is one shared `ContainerPicker` component. `lib/gtm.ts` gained a 60-second TTL cache keyed by URL+token-suffix that stores the in-flight promise (deduping concurrent requests; failures are evicted immediately so errors don't stick for the TTL). The Sync button now clears that cache and bumps a context `refreshKey` that every view's load effect depends on, so one refresh refetches everything consistently. Views keep owning their workspace-level data (tags/triggers/variables/conversion events) — only the account/container layer moved up. Alongside this, the `react-hooks/set-state-in-effect` rule (12 pre-existing errors, see ADR-0013's noted debt) was turned **off** in `eslint.config.js` with an explanatory comment: it flags the standard fetch-on-mount pattern (`setLoading(true)` in a data effect) used by every view, and the real fix is the planned move of server state to TanStack Query, not per-line suppressions scattered through the codebase. `npm run lint` is clean again and back to being a meaningful signal.
- **Consequences:** Selection persists across views and repeat visits render instantly from cache (60s staleness bound, explicit Sync for freshness). New GTM-backed views get the picker and caching for free — Preview (ADR-0019) was built directly on this. Trade-offs: a module-level cache means two components asking for the same resource share fate (intended), and turning a lint rule off is debt-by-choice — it must come back on (or become moot) when TanStack Query lands. TanStack Query would also subsume the hand-rolled cache; this ADR is the stepping stone, not the destination.

---

## ADR-0016 — Conversions scoped by a live GTM container picker, auto-provisioning the Supabase row

- **Date:** 2026-07-10
- **Status:** Accepted (extends ADR-0015)
- **Context:** After ADR-0015's migration was applied, the Conversions page still showed "No containers found for your organisation yet" for the real signed-in account. Investigation found the actual cause: nothing in the app writes to Supabase's `containers` table for a real organisation — it's only ever populated by `supabase/seed.sql` for the fictional demo org. Tags/Triggers/Variables all sidestepped this by reading live from the Google Tag Manager API instead of Supabase (see the "Reverted Triggers/Variables..." entry in `docs/ai-use-log.md`, 10/07/2026); Conversions was the one feature left depending on a Supabase container row that nothing ever created. The user separately asked for the container-scoped list to be visually grouped and formatted like Google Ads' own conversion-action UI (goal-style cards grouped by category, with a data table underneath), which surfaced a second question: Google Ads' own table shows live reported metrics (All conv., All conv. value) that TagOps-Pro has no way to produce (that's the roadmap "verify firing" feature, explicitly out of MVP scope per `docs/02-requirements.md`).
- **Decision:** Two choices were put to the user before building (via two targeted questions) rather than assumed:
  1. **Container source:** add the same live GTM Account → Container picker that Tags/Triggers/Variables already use, and auto-provision the matching Supabase `containers` row (upsert-by-`(organisation_id, gtm_container_id)`, via the new `ensureContainerForGtmContainer()` in `src/features/conversions/api/conversions.ts`) the first time a container is selected — over building a separate manual "add container" form. This removes the dead end entirely without introducing a second, disconnected way to create containers.
  2. **Metrics columns:** swap Google Ads' "All conv." / "All conv. value" columns for fields TagOps-Pro actually tracks (the Ads ID/Label pair, Value parameter + Currency) rather than showing fabricated placeholder numbers under the real column names.
  A new `getCurrentOrganisationId()` helper resolves the signed-in user's org via `organisation_members` (previously undocumented in the hand-authored `src/types/supabase.ts` — added as part of this change). The Conversions list is now grouped into per-category cards (icon + label via a new `conversion` kind on the existing shared `CategoryBadge` component) with a real `<table>` underneath each, and a "Ready"/"Needs setup" status pill derived honestly from real data (flagged only when an event has a Conversion Label but its container has no Conversion ID set — a real, checkable misconfiguration, not a fabricated one).
- **Consequences:** Conversions is now architecturally consistent with Tags/Triggers/Variables in how a container is selected (live GTM), while remaining the one feature whose actual records (conversion events) are Supabase-native rather than GTM-native — GTM has no concept of a conversion label or Google Ads category, so that data has nowhere else to live. `ConversionFormModal` lost its container dropdown (now ambient context from the page-level picker, matching how the Ads ID field is already shown read-only). `ConversionCard.tsx` was replaced outright by `ConversionTableRow.tsx` since the row is now a `<table>` row, not an `EntityRow` card — keeping the old file around unused would have been dead code. The auto-provisioning write path means selecting a GTM container in this picker now has a side effect (an INSERT into `containers` on first use) that Tags/Triggers/Variables' pickers don't have — worth being explicit about at the walk-through, since it's a deliberate, minimal write scoped by the existing RLS policies, not an oversight.

---

## ADR-0015 — Google Ads Conversion ID lives on containers, not conversion_events

- **Date:** 2026-07-10
- **Status:** Accepted
- **Context:** The Conversions page only modelled GA4 conversion events. Extending it to Google Ads conversion tracking meant deciding where two new pieces of data belong: the Conversion ID (`AW-XXXXXXXXX` — Google Ads' account-level identifier, shared by every conversion action in that account) and the Conversion Label (unique per individual conversion action). Two placements were possible for the ID: on `containers` (one row per external tracking account, matching the existing `gtm_container_id`/`ga4_property_id` columns) or on `conversion_events` (denormalised onto every action). Before writing the migration, confirmed with the developer whether a single TagOps-Pro container could ever map to more than one Google Ads account — answer: no, one Ads account per container, same as GTM/GA4.
- **Decision:** Added `google_ads_conversion_id text` to `containers` (nullable, `CHECK` on `^AW-[0-9]{6,}$`) — consistent with the existing one-external-account-per-container pattern. Added `conversion_label text` (nullable, free text — Google Ads labels have no fixed pattern) and `category text NOT NULL DEFAULT 'other'` (`CHECK` against the 15 categories Google Ads' own UI groups conversion actions into: Purchase, Add to cart, Begin checkout, Subscribe, Qualified lead, Converted lead, Submit lead form, Book appointment, Sign up, Request quote, Get directions, Outbound click, Contact, Page view, Other) to `conversion_events`. New migration `20260710000000_google_ads_conversion_tracking.sql` — the applied `20260601000000_init_schema.sql` was not edited. No new RLS policies: both tables are already scoped by `organisation_id` via `is_active_org_member()`, which covers the new columns for free.
- **Consequences:** Setting a container's Google Ads Conversion ID has no UI yet — the Conversion form shows it read-only, but there's no container/settings screen field to write it, so it can currently only be set directly in Supabase. That screen is a follow-up. `category` defaults to `'other'` rather than being nullable, since the Conversions list groups by category and an ungrouped row would need a fallback bucket regardless — making the default explicit avoids a silent "uncategorised" state. If a future requirement needs multiple Google Ads accounts per container, the ID will need to move to `conversion_events` or a new join table — flagged here so it's not a surprise later.

---

## ADR-0014 — Adopt Tailwind CSS for styling (Linear-style visual redesign)

- **Date:** 2026-07-10
- **Status:** Accepted
- **Context:** The app's UI was functional but visually ad hoc — 16 separate per-component `.css` files with hand-picked hex values repeated across files (e.g. `#0d1120`, `#1a2035`, `#2dd4bf` appear dozens of times with no shared source of truth). The user asked for a full visual redesign toward a "Linear-style" look (near-black layered surfaces, hairline borders, tight typography, fast subtle motion, visible focus rings) applied consistently across every screen. Doing this with hand-rolled CSS custom properties alone is possible, but a utility-first framework speeds up applying the same spacing/radius/color scale consistently across ~15 components in one pass, and Tailwind's own `@theme` mechanism (v4) doubles as the token system this redesign already needs.
- **Decision:** Adopt Tailwind CSS v4, installed via `@tailwindcss/vite` (the v4-native Vite plugin), not the v3-era PostCSS + `tailwind.config.js` setup. This project runs Vite 8 with Rolldown; the v4 Vite plugin is the currently-recommended, lower-friction integration path and needs no separate PostCSS config or content-globbing config file. Design tokens (surface levels, text levels, accent, border) are declared once as CSS custom properties in `src/index.css` and exposed to Tailwind via `@theme`, then consumed as utility classes everywhere. Existing per-component `.css` files are deleted as their styles migrate to inline utility classes; anything that doesn't map cleanly to a utility (the Google Fonts `@import`, the base token declarations, keyframes) stays in `src/index.css`.
- **Consequences:** This is a purely visual/presentational change — no Supabase queries, RLS, routing, or component props change. Adds one new dependency family (`tailwindcss`, `@tailwindcss/vite`) to the mandated-stack-adjacent tooling list; within the "front-end framework/styling is my choice" latitude granted by ADR-0003, so no teacher approval needed beyond noting it here. Future components should default to Tailwind utility classes and only reach for a dedicated `.css` file or extracted class-string constant when a utility string repeats more than twice or grows past ~6 utilities, per this repo's existing convention.

---

## ADR-0013 — Variables and Conversions built on the same Supabase-backed CRUD pattern as Triggers; Home unlocked

- **Date:** 2026-07-09
- **Status:** Accepted (extends ADR-0012)
- **Context:** Following ADR-0012, the user asked to link every page properly from Home and remove all remaining "Coming soon" placeholders so the app is fully operational. Variables and Conversions were still static placeholder tables with no data source, same as Triggers had been. The `variables` and `conversion_events` tables (and their RLS policies) already existed in the schema, already covered by the RLS fix and seed-access grant from ADR-0012.
- **Decision:** Replicate the exact Triggers pattern for both: hand-authored `Database` types for `variables`/`conversion_events` in `src/types/supabase.ts`, an `api/` layer per feature (list/create/update/soft-delete), a card + create/edit form modal, and a real `View` component replacing the placeholder table. `HomeView.tsx`'s section cards dropped the `live`/"Soon" flag entirely (removed, not just flipped to `true`) since every section is now genuinely operational — keeping a dead disabled-state code path would be unfinished-looking with nothing left for it to gate.
- **Consequences:** All four data-driven sections (Tags, Triggers, Variables, Conversions) are now reachable and functional from both the sidebar and Home, though Tags remains architecturally different (live GTM mirror, not Supabase) per ADR-0012. The `react-hooks/set-state-in-effect` lint rule now also fires in `VariablesView.tsx` and `ConversionsView.tsx` for the same reason it already did in the pre-existing `TagsView.tsx` and the new `TriggersView.tsx` — replicating the established pattern intentionally, not new debt in kind. Fixing it properly across all four views (and Tags) is a good candidate follow-up ADR before Week 6–7 hardening.

---

## ADR-0012 — Triggers implemented as Supabase-backed CRUD, not a GTM API mirror

- **Date:** 2026-07-09
- **Status:** Accepted
- **Context:** Triggers was 100% static placeholder markup with no data source. Two implementation paths existed: (a) mirror Tags' current pattern — a live, read-only view fetched directly from the Google Tag Manager API via the OAuth `provider_token`; or (b) build against the `triggers`/`tags`/`tag_triggers` schema already defined in `20260601000000_init_schema.sql` and `docs/04-data-model.md`, which had RLS policies and seed data but no application code reading or writing it.
- **Decision:** Build Triggers as real Supabase-backed CRUD (path b). It matches the documented data model, exercises RLS-protected writes end-to-end (relevant to the security floor and defensible at the walk-through), and uses schema/RLS work that already existed but was unused. This is the first CRUD feature in the app — no `api/` layer or write path existed anywhere before this. Two blockers surfaced during implementation and were fixed as part of the same change:
  1. **RLS bug**: the INSERT policies on `tags`, `triggers`, `variables`, and `conversion_events` all checked `where organisation_id = organisation_id` inside a subquery against `organisation_members` — a tautology (both sides resolve to that table's own column), not a check against the row being inserted. Any editor/admin/owner of *any* organisation could insert a row tagged with a *different* organisation's id. Fixed in a new migration (`20260610000000_fix_domain_insert_rls.sql`) by qualifying the right-hand side with the target table's name, matching the pattern already used correctly in the corresponding UPDATE/DELETE policies.
  2. **No real access to seed data**: `supabase/seed.sql` seeds a fake `auth.users` row unrelated to the real Google-authenticated account, so RLS correctly returned zero rows for a real sign-in. Fixed by appending a seed block that grants the real account owner access to the seeded "Need Tracking" org, matched by email (not a hardcoded UUID, since the real Auth UUID isn't known in advance).
- **Consequences:** Triggers and Tags are now architecturally inconsistent (Supabase CRUD vs. live GTM sync) until Tags is migrated to the same pattern — a candidate follow-up decision. `src/types/supabase.ts` was hand-authored to match the migration for `containers`/`tags`/`triggers`/`tag_triggers` rather than generated via `supabase gen types typescript` (no Supabase CLI/project link available in this environment) — should be regenerated properly once the CLI is set up, to avoid hand-written types drifting from the real schema. The same tautology bug likely also warrants a matching fix-forward check across any future policies copy-pasted from this file's original INSERT policies.

---

## ADR-0011 — Third-party outage risk: Supabase platform incident blocked local dev

- **Date:** 2026-07-06
- **Status:** Accepted (informational — no architectural change)
- **Context:** `npm run dev` loaded the app but it hung indefinitely on the loading spinner. Diagnosis (see `docs/ai-use-log.md`) traced this through two stages: first a stale/misresolving DNS lookup for the project's Supabase URL, then — once DNS resolved — a Cloudflare 521 ("Web server is down") from `nkdkfbejsswgllbzjhvd.supabase.co`. The Supabase dashboard showed project status as "Healthy" but with an active platform-wide banner: "We are investigating a technical issue." status.supabase.com confirmed an ongoing incident ("Project status change failures in multiple regions", started 2026-06-30, still unresolved as of 2026-07-04) explicitly listing `ap-southeast-1` (this project's region, Singapore) among affected regions.
- **Decision:** No code or config change — the app's `App.tsx` behaviour (block on `supabase.auth.getSession()` before rendering Login/Dashboard) is correct; the outage was entirely on Supabase's infrastructure side, outside this project's control. Treat this as confirmation that TagOps-Pro has a hard runtime dependency on Supabase's availability, with no fallback path.
- **Consequences:** Local dev and any deployed environment are both unavailable for the duration of a Supabase incident, with no graceful degradation — `App.tsx` shows an infinite spinner rather than a timeout/error state. Worth addressing before Week 6–7 hardening: add a timeout on `getSession()` so the UI surfaces a "service unavailable, try again" message instead of spinning forever. This single-point-of-failure risk (mandated backend-as-a-service, no self-hosted fallback) is a relevant discussion point for `docs/05-security-review.md` and the Section 2 tool-justification writeup, since it's a direct trade-off of the mandated stack (see ADR-0003) rather than a choice made freely.

---

## ADR-0010 — organisations INSERT policy: auth.uid() IS NOT NULL

- **Date:** 2026-06-03
- **Status:** Accepted
- **Context:** The v2 migration spec changed the organisations INSERT policy from `auth.uid() = owner_id` (the caller must set themselves as owner) to `auth.uid() IS NOT NULL` (any authenticated user can insert an org with any owner_id value).
- **Decision:** Follow the spec: `auth.uid() IS NOT NULL`. This is simpler and sufficient for the MVP where users only create orgs for themselves. The `auto_owner_membership()` trigger still enforces that the `owner_id` is added as a member immediately after org creation.
- **Consequences:** A technically motivated user could create an org with another user's `owner_id`, making that other user an owner of an org they didn't create. This is an unlikely edge case in the current single-user MVP but would need tightening (revert to `auth.uid() = owner_id`) before launching multi-tenant to untrusted users. Flagged as a hardening item for `docs/05-security-review.md`.

---

## ADR-0009 — Sequence-generated placeholder display_ids in auth triggers

- **Date:** 2026-06-03
- **Status:** Accepted (supersedes ADR-0005's nullable display_id approach)
- **Context:** ADR-0005 (01/06/2026) made `display_id` nullable in `public.users` and `public.organisation_members` so that `handle_new_user()` and `auto_owner_membership()` could insert rows without knowing the org-specific PREFIX_XX_NNNN code. The v2 spec instead asks for a placeholder value like 'USRID_XX_0000'. But a hard-coded literal breaks the UNIQUE constraint when a second user signs up.
- **Decision:** Create two sequences (`public.user_display_id_seq`, `public.member_display_id_seq`) and have the trigger functions generate 'USRID_XX_NNNN' and 'MEMID_XX_NNNN' values from them. These match the `^[A-Z]{2}_[A-Z]{2}_[0-9]{4}$` CHECK constraint and are unique across all rows. `display_id` stays NOT NULL in both tables. The app or seed later updates the placeholder to the real org-specific code via DO UPDATE.
- **Consequences:** Sequences persist across restarts and are not reset by re-running the migration (IF NOT EXISTS guards). Two sequences are a small addition. The trade-off vs. nullable: stricter schema with a richer "invariant story" — every row always has a syntactically valid display_id. The seed must use DO UPDATE (not DO NOTHING) for the owner membership row and for public.users, since the triggers insert first.

---

## ADR-0008 — Seed UUID pattern: hex-prefix entity type encoding

- **Date:** 2026-06-03
- **Status:** Accepted (supersedes ADR-0006's second-group encoding)
- **Context:** The v2 seed spec asked for a "simple, readable pattern" with examples `a0000000-...-000000000001` for users and `b0000000-...-000000000001` for orgs. ADR-0006 used a different pattern (second group = entity type).
- **Decision:** Use first-group hex-prefix to encode entity type: a=users, b=organisations, c=members, d=containers, e=tags, f=triggers, 07=variables, 08=conversion_events. The last group encodes the zero-padded sequential record number. Example: `e0000000-0000-0000-0000-000000000001` = first tag (TAGID_AG_0001). Variables and conversion_events use two-digit numeric prefixes (07, 08) because the hex alphabet (0-9, a-f) is exhausted at f=triggers.
- **Consequences:** The pattern is self-documenting without the comment block once the convention is known. The 07/08 prefix break the alphabetic run but are still unambiguous. These UUIDs look obviously synthetic, which is the right signal for dev/test-only data.

---

## ADR-0007 — tag_triggers RLS uses subquery through tags (no organisation_id column)

- **Date:** 2026-06-01
- **Status:** Accepted
- **Context:** `public.tag_triggers` is a junction table with a composite primary key `(tag_id, trigger_id, relationship)`. Like the schema.sql design, it carries no `organisation_id` column of its own. The RLS policies on every other domain table use `is_active_org_member(organisation_id)` directly. This approach is not available for tag_triggers.
- **Decision:** tag_triggers RLS policies resolve the org context by subquery through the parent `public.tags` row: `is_active_org_member((SELECT t.organisation_id FROM public.tags t WHERE t.id = tag_triggers.tag_id))`. INSERT/UPDATE/DELETE policies join `public.tags → public.organisation_members` inline.
- **Consequences:** Slightly higher query cost per tag_trigger RLS evaluation (one extra lookup through tags). No RLS recursion because tags SELECT policy calls `is_active_org_member()` (SECURITY DEFINER), which bypasses RLS when reading organisation_members. Alternative of adding an `organisation_id` denormalisation column to tag_triggers would remove the subquery but duplicate data that's already enforced through the FK chain — rejected as unnecessary for this MVP scale.

---

## ADR-0006 — Hard-coded deterministic UUIDs in seed.sql

- **Date:** 2026-06-01
- **Status:** Accepted
- **Context:** The seed.sql prompt required hard-coded UUIDs (no `gen_random_uuid()`) so the seed is reproducible across runs and easy to cross-reference. A naming convention was needed that is both human-readable and unambiguous.
- **Decision:** UUID second group encodes entity type: `0001`=user, `0002`=org, `0003`=member, `0004`=container, `0005`=tag, `0006`=trigger, `0007`=variable, `0008`=conversion_event. The last group encodes the sequential record number. Example: `00000000-0005-0000-0000-000000000001` = first tag (TAGID_AG_0001). The mapping is documented in a comment block at the top of seed.sql and is self-documenting without the comment once the convention is known.
- **Consequences:** UUIDs are valid (Postgres accepts them), unique within the seed, and trivially re-derivable. They look obviously synthetic, which is the right signal for dev/test-only data. The downside is that these UUIDs will conflict if the same seed is run against a production database that already has real records with the same IDs — but seed.sql is explicitly labelled as dev/test only and should never be run against a production database with live traffic.

---

## ADR-0005 — display_id nullable in public.users and public.organisation_members

- **Date:** 2026-06-01
- **Status:** Accepted
- **Context:** The schema.sql draft declared `display_id NOT NULL` on every table, including `public.users` and `public.organisation_members`. However, both tables have SECURITY DEFINER auto-insert triggers that fire in contexts where the application cannot yet assign a `PREFIX_XX_NNNN` display ID:
  - `handle_new_user()` fires on `auth.users INSERT` before any user session exists and before an org context is known. The `USRID_XX_NNNN` code encodes the org's two-letter code (e.g., `AG`), which is not available at signup time.
  - `handle_new_organisation()` fires on `public.organisations INSERT` before the application has had a chance to assign a `MEMID_XX_NNNN` code to the owner membership row it creates.
  If `display_id` is `NOT NULL`, both triggers would fail with a NOT NULL violation.
- **Decision:** Make `display_id` nullable (remove `NOT NULL`) in `public.users` and `public.organisation_members` only. The CHECK constraint remains in place — it simply does not fire when the column is NULL (PostgreSQL evaluates `NULL ~ '^...$'` as NULL, which does not fail a CHECK). All other tables keep `display_id NOT NULL` because the application always sets it explicitly at insert time. The app fills in the real display_id during the user's onboarding flow (for users) or immediately after org creation (for the owner membership via seed/app logic).
- **Consequences:** A freshly-signed-up user will have `display_id = NULL` in `public.users` until onboarding completes. Queries that filter or sort by `display_id` must handle NULL. The seed uses `ON CONFLICT DO UPDATE SET display_id = excluded.display_id` (not DO NOTHING) for these two tables to ensure the correct value is always set on every seed run, even when trigger-inserted stubs are already present.

---

## ADR-0004 — Replaced public.profiles with public.users as the auth mirror table

- **Date:** 2026-06-01
- **Status:** Accepted (supersedes migration 20260507141000_profiles.sql)
- **Context:** Migration `20260507141000_profiles.sql` created `public.profiles` as the auth mirror table, with a `handle_new_user()` trigger pointing at it. The data dictionary (`docs/04-data-model.md`), the seed data in `seed-data/*.json`, and `seed-data/schema.sql` all use `public.users` as the auth mirror table name, with a richer schema (`display_id`, `display_name`, `avatar_url`). The two were in direct conflict: any migration built on `schema.sql` would fail because `public.profiles` would already exist and `public.users` would not.
- **Decision:** Drop `public.profiles` (and its trigger/function) in the new migration `20260601000000_init_schema.sql` and create `public.users` in its place. The `handle_new_user()` function is recreated to target `public.users`. The table name `users` is more conventional for a Supabase auth mirror (it mirrors the `auth.users` table name) and is consistent with every other reference in the project folio.
- **Consequences:** The profiles migration is effectively superseded. The `DROP ... IF EXISTS` guards in the new migration mean it is safe to run on a fresh Supabase project (where profiles was never applied) as well as on the existing project (where it was). Any code written against `public.profiles` (none exists yet) would need to be updated to reference `public.users`.

---

## ADR-0003 — Stack mandated by AT3 brief: Vercel + Supabase + Claude Code + VS Code

- **Date:** 2026-05-13
- **Status:** Accepted (mandated by AT3 brief)
- **Context:** The Noetica Academy AT3 brief mandates a single infrastructure stack for all submissions. Off-stack deviations require explicit teacher approval before end of Week 3.
- **Decision:**
  - **Hosting / deployment:** Vercel (continuous deployment from the Git repo).
  - **Backend:** Supabase — Postgres, Auth, RLS, Storage, Edge Functions.
  - **AI assistant:** Claude Code.
  - **Editor:** VS Code.
  - Frontend framework remains my choice (see ADR-0001).
- **Consequences:** No separate backend server to maintain; Supabase RLS becomes the primary authorisation mechanism. Authentication via Supabase Auth with Google OAuth satisfies the "sign up in under 2 minutes" requirement. Tool choices must be defensible in Section 2 of the report and at the Week 10 walk-through. Several earlier "open questions" (backend, auth, hosting) are now settled.

---

## ADR-0002 — Documentation lives in `/docs` as Markdown

- **Date:** 2026-05-13
- **Status:** Accepted
- **Context:** Need a low-friction place to capture problem framing, requirements, decisions, and AI usage. Want it versioned alongside the code so it does not drift. The AT3 brief also mandates a `/docs` folio.
- **Decision:** Use a `/docs` folder at the repo root with numbered Markdown files (`01-problem-statement.md`, `02-requirements.md`, etc.) plus `decision-log.md` and `ai-use-log.md`. No wiki, no separate doc tool.
- **Consequences:** Docs are reviewed in pull requests like code. The marking teacher reads them on GitHub or in the IDE. Revisit if a non-developer co-founder joins.

---

## ADR-0001 — Frontend stack: Vite + React + TypeScript

- **Date:** 2026-05-13
- **Status:** Accepted (inferred from existing `node_modules` and Vite scaffold README)
- **Context:** Need a productive frontend stack for a single-page web app with rich UI (dropdowns, lists of tags/triggers, account management). Solo developer, AI-assisted workflow. The AT3 brief leaves frontend framework as my choice.
- **Decision:** Vite (Rolldown) + React + TypeScript, with ESLint and `@typescript-eslint`.
- **Consequences:**
  - Fast dev server and modern tooling out of the box.
  - TypeScript adds upfront friction but pays off when AI assistants reason about types — and when defending code at the walk-through.
  - Matches the StudyShare worked example, which lowers the cost of borrowing patterns from it.
  - Still need to decide: styling (Tailwind vs CSS modules), routing (React Router vs TanStack Router), state (Zustand vs Redux Toolkit vs TanStack Query alone), test framework (Vitest + Playwright is the default plan). See open ADRs below.

---

## Open Questions (to be turned into ADRs)

- **Styling system.** Tailwind, CSS Modules, or a component library (shadcn/ui, Mantine)?
- **State / data fetching.** TanStack Query + Zustand is the planned default; confirm before building the first feature.
- **Routing.** React Router or TanStack Router?
- **Testing framework.** ~~Vitest for unit/integration~~ — Vitest adopted for the unit tier (ADR-0019). Playwright for smoke still to confirm before Week 8.
- **OAuth scopes for Google Tag Manager / GA4.** Read-only is fine for the MVP; what does the verification feature on the roadmap need?
- **`decision-log.md` vs `decisions.md` filename.** AT3 spec uses `decisions.md`. Decide with teacher whether to align.
