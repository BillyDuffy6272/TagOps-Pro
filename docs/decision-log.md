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

## ADR-0039 — Post-removal cleanup: rebuilt the orphaned request-access UI, fixed a stale README, closed two flagged doc gaps

- **Date:** 2026-08-28
- **Status:** Accepted
- **Context:** Asked whether the site was "officially done." Answer was no — walked through real, already-documented open items (`08-test-plan.md`'s known gaps, `09-iteration.md`'s no-UAT note) plus the request-access regression ADR-0038 flagged and left unresolved. Asked to fix the regression, fix the README's own status line, and resolve any other unresolved issues at discretion.
- **Decision:**
  1. **Rebuilt the request-access flow's UI.** It never lived anywhere but `ConversionsView` (deleted in ADR-0038) — the `access_requests` table, RLS, `requestAccess()`/`getMyLatestAccessRequest()`, and the owner/admin approval panel in `SettingsView` all still worked, but no viewer had a button to trigger one. Added a new "Your access" section to `SettingsView`, shown only to viewers, reusing the exact request/pending/dismissed copy and logic the deleted view used (recovered from git history rather than re-invented from scratch) so the UX doesn't regress from what was already reviewed and shipped.
  2. **Fixed `README.md`'s status section**, which still read "In Week 2 (kick-off)... architecture, data model, and migrations not yet started" — description of the repo's very first day, long stale. Replaced with an accurate summary of what's built plus the genuinely open gaps (no RLS integration/Playwright suite, no UAT session), rather than just claiming "done."
  3. **Renamed `09-iteration.md` → `09-iteration-log.md`**, closing a mismatch the file itself had flagged against `CLAUDE.md`'s required repo shape and `README.md`'s own folio index (both already named it `09-iteration-log.md`). Only its own non-historical "Naming note" was edited to mark this resolved — the git-log-sourced Part 1 table, which this file's own rule says never gets reworded, was untouched.
  4. **Added the missing `.env.example`**, flagged as absent in `05-security-review.md`'s "Known limitations" despite `CLAUDE.md`'s required repo shape listing it — documents `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` with no real values. Removed the now-resolved bullet from the security review's limitations list rather than leaving a stale flag.
- **Consequences:** `npm run lint`/`typecheck`/`test` pass (29/29, unchanged). Deliberately did **not** attempt the two larger gaps still open — an RLS integration test suite and a Playwright smoke suite — since building real test infrastructure is a substantially bigger undertaking than a cleanup pass and wasn't asked for; left as the highest-priority item in `07-evaluation.md`'s future-improvements list. Also left the `decision-log.md`/`decisions.md` filename question and a UAT session untouched — the former is explicitly pending teacher confirmation, the latter needs a real outside tester, not something to fabricate.

---

## ADR-0038 — Removed conversion-event tracking entirely: code, database, and docs

- **Date:** 2026-08-28
- **Status:** Accepted (supersedes ADR-0035, ADR-0036, ADR-0037)
- **Context:** Follow-up to ADR-0037. After being shown what applying for a real Google Ads Developer Token actually involves — a real Google Ads Manager account, an application Google reviews with no guaranteed timeline, plus a new Edge Function to hold the token/OAuth secrets and proxy report queries once approved — decided it was too complicated and too risky to depend on this close to the fixed AT3 deadline. Requested full removal: the feature from the live site, and every trace of it from the documentation, with an explicit out-of-scope recommendation recorded rather than silently deleted.
- **Decision:**
  1. **Code.** Deleted `src/features/conversions/` entirely (views, modals, API layer, snippet generator, live-verification snippet) and `tests/unit/snippets.test.ts`. Removed every dependent reference: the `conversions` entry from `AppShell.tsx`'s `ActiveView` union and route switch, the nav item in `navItems.tsx`, the Home page's guide entry, the Landing page's feature card and copy, and the now-dead `SUPABASE_URL`/`SUPABASE_ANON_KEY` exports from `src/lib/supabase.ts` (they existed solely for the live-verification snippet). Left one thing deliberately unaddressed rather than silently deciding it: `requestAccess()` (`src/lib/organisation.ts`) and the "no pending requests" panel in `SettingsView` are now orphaned — ConversionsView was the *only* place a viewer could trigger a "request edit access" call, so that whole request flow currently has no UI entry point, even though its backend (the `access_requests` table, RLS, and the owner/admin approval panel) still works. Flagging this rather than fixing it, since it's a real functional gap this removal created, not something implied by "remove conversions."
  2. **Database.** New migration `20260828030000_remove_conversion_tracking.sql`, pushed live via `supabase db push --linked` and confirmed via `supabase migration list --linked`: drops `conversion_events` and `live_verification_events`, drops the `conversion_event_belongs_to_org()` `SECURITY DEFINER` function from ADR-0035, and drops `containers.google_ads_conversion_id` plus its `CHECK` constraint. `containers` itself is untouched — `tags`/`triggers`/`variables` all still depend on it as a foreign key, conversion_events was just one of its four children. `supabase/seed.sql` had its three conversion-event `INSERT` blocks and the now-inaccurate UUID-prefix comment removed so a fresh `db reset` doesn't fail. `src/types/supabase.ts` was hand-edited (not regenerated) to remove exactly the affected type entries — a full `supabase gen types` regenerate was tried first and rejected because it pulled in unrelated drift from a newer CLI version (the `access_requests.status` column's literal union type `"pending" | "approved" | "dismissed"` degraded to plain `string`, plus an unrelated `graphql_public` schema block appeared) that had nothing to do with this change.
  3. **Docs.** Following the project's own established convention (the dated note already present in `02-requirements.md` for the Preview-mode scope overlap, and the "do not edit historical entries" rule for this log): historical/log-like content (`02-requirements.md`'s original MVP/WOULD BE NICE lines, `09-iteration.md`'s git-log-sourced Part 1 table, this log's own ADR-0035–0037) was left as originally written, with a new dated note appended alongside rather than rewritten in place. Living technical docs describing the *current* system (`03-architecture.md`, `04-data-model.md`, `05-security-review.md`, `06-front-end-architecture.md`, `07-evaluation.md`, `08-test-plan.md`, `README.md`) were directly edited to stay accurate, since a diagram or table showing a dropped table is just wrong, not a preserved record. The one deliberate exception: `05-security-review.md`'s injection-bug worked example was kept (with a note that the feature it describes no longer exists) because it's real evidence of the security-floor process catching and fixing a genuine bug — evidence worth keeping for the report even though the code it's about is gone. Explicit out-of-scope recommendation added to `02-requirements.md` per the request, rather than just quietly removing the original requirement lines.
- **Consequences:** `npm run lint`/`typecheck` pass; the test suite dropped from 36/36 to 29/29 (the 7 removed tests were `snippets.test.ts`'s, including the two adversarial injection tests from ADR-0035/the 27/08/2026 audit — a real, if small, loss of regression coverage, not just a number change, called out directly in `07-evaluation.md` and `08-test-plan.md` rather than left implicit). The orphaned request-access entry point (point 1 above) is a genuine open item, not yet resolved. If Google Ads API access is ever revisited, ADR-0037's research (developer-token requirement, restricted-scope OAuth consent-screen risk, need for a server-side proxy) is still valid and doesn't need re-deriving.

---

## ADR-0037 — Decided to pull real conversion data from the Google Ads API; blocked on external developer-token approval

- **Date:** 2026-08-28
- **Status:** Superseded by ADR-0038 (removed rather than built, given the approval-timeline risk)
- **Context:** Follow-up to ADR-0036. Clarified that "conversion events" showing local, manually-entered records (per the original requirement in `02-requirements.md:11` — link an ID, generate a snippet) wasn't what was wanted; the intent is for TagOps-Pro to actually display live conversion data pulled *from* the business's real Google Ads account, the same way Tags/Triggers/Variables already read live from the GTM API. This is a genuine scope change: GTM/GA4 (already in the mandated stack) only need OAuth + an enabled API; the Google Ads API additionally requires a **developer token** issued per Google Ads manager account, subject to Google's own review ("Basic access" for real, non-test accounts is not self-serve). Presented three options — build now against a Google-issued test account, apply first and build once approved, or drop live-data scope entirely — and the test-account/build-blind option and the drop-scope option were both explicitly declined in favour of applying for real access first.
- **Decision:** Defer all integration code until a real Basic-access developer token exists. Nothing has been written yet — no Edge Function, no added OAuth scope, no API client — because none of it is testable against real data without the token, and every prior feature in this project was verified against a real live endpoint before being called done (ADR-0033, ADR-0035); writing an untestable Ads API integration now would break that pattern. Documented for whoever picks this back up: getting the token requires a real Google Ads Manager (MCC) account applying via API Center — this cannot be done by AI on the user's behalf. Separately flagged a real risk for when the scope is added: `adwords` is a Google-restricted OAuth scope, so while the app's OAuth consent screen stays in Testing mode (realistic for this timeline — full verification is not), only Google accounts explicitly added as test users can authorize it. Bundling that scope into the same `signInWithOAuth` call used for ordinary login (`Login.tsx`) risks breaking sign-in entirely for any real user who isn't allow-listed — this needs its own careful design, not a one-line scope addition, once the token exists.
- **Consequences:** The feature is genuinely blocked on something outside this project's control, with real risk it isn't resolved before the Week 10 walk-through or Week 11 deadline. If the token doesn't arrive in time, the fallback is the already-shipped, already-tested local conversion-event + snippet + firing-verification flow from ADR-0035/0036, which remains fully functional on its own regardless of this ADR's outcome. Revisit this ADR (supersede, don't edit) once a developer token exists, with the actual access tier it was granted at.

---

## ADR-0036 — Reworded "Link Google Ads" UI to describe what it actually does (a manual ID field, not an OAuth connection)

- **Date:** 2026-08-28
- **Status:** Superseded by ADR-0038 (the UI this reworded no longer exists — the whole feature was removed)
- **Context:** Flagged in an audit pass that `GoogleAdsSettingsModal.tsx` and the wording around it use connection-style language — a "Link Google Ads" button, a green/amber status dot, "Linked to Google Ads" / "Not linked" labels — even though `updateContainerGoogleAdsId()` just writes a plain text field (`google_ads_conversion_id`) straight to the container row. There is no OAuth flow, no Google Ads API call, no token of any kind. Asked whether to reword the UI for honesty or build a real Google Ads OAuth connection instead.
- **Decision:** Reworded, did not build OAuth. A real connection would need a Google Ads API developer-token application (an external approval process, not something to start this late in a fixed 9-week build), a token-refresh backend (this stack has no server beyond Supabase Edge Functions), and OAuth consent-screen verification — none of which is in the mandated or optional stack in `CLAUDE.md`, which only lists GTM/GA4 APIs as read-only integrations. Changed "Link Google Ads" → "Set Google Ads ID" (`ConversionsView.tsx`), "Linked to Google Ads" → "Google Ads ID set" (same stat row), "Not linked" → "No Google Ads ID" (`ConversionTableRow.tsx`), the snippet modal's "isn't fully linked to Google Ads yet" → "Google Ads conversion ID and label aren't fully set yet" (`ConversionSnippetModal.tsx`), and the form modal's reference to the old button name (`ConversionFormModal.tsx`). Left `GoogleAdsSettingsModal.tsx`'s own copy alone — "Google Ads settings" and "Leave empty to unlink" were already accurate, since unlinking there really does mean clearing the stored field.
- **Consequences:** The feature's actual mechanism — a shared conversion ID the account owner copies in manually — now matches what the UI implies. A real OAuth-based Google Ads connection remains a plausible post-MVP idea but is explicitly out of scope for this submission; if picked up later it needs its own ADR before any client code assumes a Google-issued token exists. `npm run lint`/`typecheck` pass; no logic changed, only copy.

---

## ADR-0035 — Real firing verification, via a console-paste snippet run on the business owner's own site

- **Date:** 2026-08-28
- **Status:** Superseded by ADR-0038 (the feature this verified — conversion-event tracking — was removed entirely)
- **Context:** Asked what feature I'd add; recommended real firing verification — confirming a tag/conversion event actually fires on the live site, rather than Preview mode's local simulation of what *would* fire — since it's the single feature that most directly answers the original problem statement ("verify tracking is running and operational"). The blocker: the mandated stack (Vercel + Supabase, no separate backend) can't run a headless browser to load and observe an arbitrary live page. Asked which of two workable mechanisms to build; chose the lighter one — a one-time snippet the business owner pastes into their own browser console, over a permanently-installed script tag.
- **Decision:** New `live_verification_events` table. The snippet (generated per-conversion-event by `LiveVerifyModal`, built in `features/conversions/lib/liveVerification.ts`) wraps `window.dataLayer.push` on the real page for 10 minutes and POSTs each pushed event straight to Supabase's REST API using only the public anon key — there is no Supabase session at all on a third-party site, so this is genuinely anonymous, authenticated purely by a random per-check UUID token plus an INSERT policy requiring the token's `conversion_event_id`/`organisation_id` pair to reference a real, non-deleted event. `SUPABASE_URL`/`SUPABASE_ANON_KEY` were exported from `src/lib/supabase.ts` for reuse rather than re-reading `import.meta.env` in a second place. The `ConversionsView` modal polls for matching rows every 2s and shows a live "Verified" banner the moment the expected event name shows up, with the raw list of everything else it saw in the meantime — useful when an event fires under a different name than expected.
- **Consequences:** This was verified end-to-end against the *live* Supabase project, not just reviewed — and that testing caught a real bug before it shipped: the first version of the INSERT policy checked `exists (select 1 from conversion_events where ...)` directly, but `conversion_events` has its own RLS requiring org membership, which the anonymous `anon` caller doesn't have — so every anonymous insert was silently rejected (`42501`) regardless of how correct the token was, the exact same class of "RLS policy queries a table the caller can't see through" mistake documented before. Fixed with a `SECURITY DEFINER` function (`conversion_event_belongs_to_org`), same pattern as `is_active_org_member`. Re-tested the identical request afterward and got a real `201 Created`, confirmed the row's data via a privileged read, confirmed a mismatched org/event is still correctly rejected, and confirmed the exact generated snippet — not a hand-written approximation — succeeds when executed in a genuinely separate-origin browser page. The one link not directly provable in this sandbox: the authenticated read-back inside the real app, since that requires a real Google-logged-in session this environment doesn't have — it relies on the same, already-proven `is_active_org_member` SELECT pattern used by every other feature, not a new one.

---

## ADR-0034 — Added a marketing landing page in front of Login, sourced from a screenshot for layout inspiration

- **Date:** 2026-08-28
- **Status:** Accepted
- **Context:** Every unauthenticated visitor previously landed straight on the Google sign-in card — no explanation of what the product does before asking for OAuth access. Asked for a proper landing page, given a screenshot of an unrelated SaaS product ("Revio") purely for layout inspiration (dark hero, badge row, bold headline, floating UI mockup, feature grid), with two explicit constraints: no pricing section (there is none), and the CTA must lead into the existing sign-in flow rather than replace it.
- **Decision:** New `src/pages/Landing.tsx`, shown by default to signed-out visitors; `App.tsx` now holds a `showLogin` flag that the Landing page's "Get started" buttons flip to true, revealing the existing `Login` component. Added a matching `onBack` prop to `Login` so its logo/wordmark returns to Landing, closing the loop. Content is deliberately not a copy of the reference screenshot: no fabricated statistics ("12K+ businesses" etc. — this product has no real users to cite), no fake nav items to pages that don't exist (Company/Blog/Contact), and the hero's floating UI mockup shows an actual stylised Tag row and Conversion-status card using the app's real component language (`EntityRow`-style layout, `StatusDot`/`CategoryBadge` colors) instead of the reference's unrelated credit-card/coin imagery. Six feature cards describe real, shipped functionality only (Tags/Triggers/Variables, conversion tracking + snippets, Preview mode, role-based permissions, Google sign-in, theming) — nothing aspirational or roadmap-only. Fully theme-aware via the existing token system, unlike `Login.tsx`'s fixed-dark backdrop.
- **Consequences:** Verified in the isolated preview harness in both themes: full click-through from Landing → "Get started" → the real `Login` component rendering, zero console errors. One icon (`Roles that actually mean something`) was swapped from a shield+checkmark (visually indistinguishable from the conversion-tracking icon at 20px) to a two-person icon after reviewing the screenshot — a small but real legibility fix caught by actually looking at the rendered result rather than trusting the JSX.

---

## ADR-0033 — Deployed the pending migrations to production; found and closed a live copy of the RLS bug in the process

- **Date:** 2026-08-28
- **Status:** Accepted
- **Context:** It occurred to me and felt important to make clear differences for user-assigned roles — Owner, Admin, Editor, and Viewer meant nothing different in practice, which is what led to ADR-0031's role-gating and request-access work. After that shipped and got committed, I still couldn't see the "Request edit access" feature actually working on the real site. Investigation traced this to something bigger than a missing UI: the Supabase CLI's migration bookkeeping showed every migration since 1 June had never actually been applied to the live project — only the two oldest ones (from the initial scaffold) were recorded as run. The live database's schema had apparently been kept working via ad-hoc SQL run directly in the Supabase dashboard at various points (matching the "live-debugged against production via SQL Editor" note in ADR-0025), never through the CLI, so `supabase db push` had been silently falling further and further behind for months.
- **Decision:** Verified every one of the 7 pending migrations was safe to re-run against a database that might already have parts of this schema — every `CREATE` guarded with `IF NOT EXISTS` / preceded by `DROP ... IF EXISTS` / using `CREATE OR REPLACE` — before running `supabase db push --linked` for real. Checked the live database directly before and after (via `supabase db query`, not just trusting the push output) to confirm two things: the `access_requests` table and its four RLS policies now genuinely exist, and — the more serious finding — the exact self-referential RLS tautology bug fixed on paper in ADR-0029 was still live and exploitable in production the entire time, because its fix migration had never actually reached the real database either. Re-checked the live policy text after the push and confirmed the fix is now actually in effect, not just committed to a file.
- **Consequences:** The feature this whole thread started from is now genuinely live, not just merged. More importantly, a real, previously-unnoticed gap between "fixed in the repo" and "fixed in production" is now closed — and worth remembering going forward: a migration file existing in `supabase/migrations/` and being committed to git says nothing about whether it's actually been applied to the live project. `supabase migration list --linked` is now the way to check that, not an assumption.

---

## ADR-0032 — Logo accent color matched to the app's actual accent; Login page's mismatched logo replaced

- **Date:** 2026-08-28
- **Status:** Accepted (closes the follow-up noted in ADR-0030)
- **Context:** The favicon mark (now used as the app's logo in the Sidebar and loading screen, per ADR-0030) had a bright mint-green accent dot (`#39ffb0`) that didn't match `--color-accent` (`#8b8ef7` dark / `#5b52e0` light) used everywhere else in the UI. Separately, `Login.tsx` — the actual first screen most users see — still had its own unrelated inline hexagon logo (indigo polygons), a mismatch flagged as a known follow-up when the favicon-as-logo change was made but not addressed at the time.
- **Decision:** Changed the accent dot in both `public/favicon.svg` and `public/favicon-light.svg` to the exact `--color-accent` hex value for that tile's theme, rather than introducing a fourth bespoke color. Replaced `Login.tsx`'s hexagon `<svg>` with the same theme-aware `<img>` pattern already used in `Sidebar.tsx`/`App.tsx` (`resolvedTheme === 'light' ? favicon-light.svg : favicon.svg`), so all three logo placements are now the same asset.
- **Consequences:** The app has one logo mark used consistently everywhere a logo appears, in the correct brand color, in both themes. Verified visually in an isolated preview harness across Sidebar/loading-screen/Login × light/dark (6 combinations, no console errors). The Login page's outer background gradient is unrelated to this change and was left untouched.

---

## ADR-0031 — Editor vs. viewer actually differ now: role-gated write UI + a request-access flow

- **Date:** 2026-08-28
- **Status:** Accepted
- **Context:** Asked why editor and viewer had no practical difference. Investigation found the database already enforces the boundary correctly — every write policy on `tags`/`triggers`/`variables`/`conversion_events`/`containers` requires `role in ('owner', 'admin', 'editor')`, excluding `viewer` — but no component in `src/` ever checked a member's role before showing write UI. `ConversionsView.tsx` (the one Supabase-backed, genuinely writable feature; Tags/Triggers/Variables are read-only from GTM for every role by design, so there's nothing to gate there) showed "New conversion event," Edit, Delete, and "Link Google Ads" to every member regardless of role. A viewer would see the same buttons an editor does, click one, and only then hit a raw RLS rejection. Asked whether to just fix the UI to match the existing DB boundary, or also add a real way for a viewer to ask for more access — chose both.
- **Decision:**
  1. **Role-gated UI.** `ConversionsView` now resolves the caller's actual role (`getMyMembership`) instead of discarding it, and hides Create/Edit/Delete/"Link Google Ads" for viewers; `ConversionTableRow` takes a `canWrite` prop gating Edit/Delete specifically (the read-only "Code" — view the tracking snippet — stays available to everyone, since viewing isn't a write). This is UI-layer honesty about a boundary the database already enforced, not a new security control.
  2. **A new `access_requests` table** (`20260828000000_access_requests.sql`) lets a viewer ask to become an editor: `requested_role` is hardcoded to `'editor'` (no general role-request system — the only meaningful bump for a viewer is to editor), a partial unique index allows only one *pending* request per person per org, and RLS restricts INSERT to active viewers requesting for themselves, SELECT to the requester (their own rows) or an owner/admin (all of their org's rows), and UPDATE (resolving a request) to owner/admin only, with a `WITH CHECK` forcing the new status to `approved`/`dismissed`.
  3. **Approving actually grants the access** — `resolveAccessRequest()` updates the requester's `organisation_members.role` to `'editor'` in the same action as marking the request approved, rather than just recording a decision with no effect. `SettingsView` gained an "Access requests" section, visible to owner/admin only, listing pending requests with Approve/Dismiss.
- **Consequences:** A viewer who's just been approved won't see their new permissions until their next full load of `ConversionsView` (membership is fetched once per mount; there's no realtime subscription to pick up an admin's approval mid-session) — an acceptable, disclosed limitation rather than a bug, given the app has no realtime infrastructure anywhere else either. `Tags`/`Triggers`/`Variables` remain equally read-only for every role, by design — that's not a gap this ADR leaves open, it's the existing GTM read-only boundary from the tracking-platform safety rules. Verified via an isolated preview harness: `ConversionTableRow` screenshotted and DOM-checked with `canWrite` both ways (Edit/Delete present only when true, Code always present); the full role-gating and access-request flow inside `ConversionsView`/`SettingsView` was verified by code review and `lint`/`typecheck`/`test` rather than a live screenshot, since exercising it end-to-end needs a real multi-user Supabase session this sandbox doesn't have.

---

## ADR-0030 — Home page "what each page shows" guide, made collapsible; unified the app logo

- **Date:** 2026-08-28
- **Status:** Accepted
- **Context:** Asked for a plain-language explainer on the Home page for each of Tags/Triggers/Variables/Conversions/Preview, aimed at business owners unfamiliar with GTM/GA4 terms — directly answers a "would be nice" item already in `02-requirements.md` ("Home page that shows all what the different pages refer to"). First cut added five icon+heading+paragraph blocks directly under the existing nav card list; feedback was that it read as crowded and probably unnecessary for a returning user who already knows the app. Separately, asked for the app's browser favicon (a magnifying-glass mark, `public/favicon.svg`) to appear as the actual in-app logo rather than the sidebar's previous unrelated inline mark, on both the initial auth-loading screen and the sidebar's top-left brand slot.
- **Decision:** Rebuilt the guide as a single disclosure — one bordered container (`overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken`, matching the pattern already used for `ConversionsView`'s collapsible category groups) holding a toggle button and, when expanded, the five explainer entries inside the *same* container with a `border-t` divider, collapsed by default. Uses `aria-expanded`/`aria-controls` (via `useId`) rather than just visual state. For the logo: replaced `Sidebar.tsx`'s old inline SVG mark with `<img src="/favicon.svg">`, and added the same image above the spinner on `App.tsx`'s initial loading screen — so the browser tab icon, the loading screen, and the sidebar now show one consistent mark instead of two different ones (a third, distinct mark still exists on the Login page, deliberately left alone — out of scope for this request).
- **Consequences:** Verified via an isolated preview harness (real components, fake session/props, no live Supabase/GTM needed) rather than guessing — screenshotted the collapsed/expanded states and the logo in both themes, and confirmed via DOM inspection that the toggle button and revealed content are both children of the one bordered `<section>`. `npm run lint`/`typecheck`/`test` all pass throughout (still 36/36 — no new tests needed, no logic under test changed). The Login page's separate hexagon logo is a known follow-up if full brand consistency is wanted later.

---

## ADR-0029 — Full-repo audit found and fixed two RLS privilege-escalation bugs and a snippet-injection gap

- **Date:** 2026-08-27
- **Status:** Accepted
- **Context:** Asked for a full audit of the repo (security, accessibility, general code quality), excluding `/docs`. Three parallel reviews plus manual verification of every high-severity claim turned up several items serious enough to fix immediately rather than just log for later, ahead of the Week 10 walk-through where every one of these would be a fair question.
- **Decision:**
  1. **`containers` INSERT RLS bug.** The `organisation_id = organisation_id` self-referential tautology that `20260610000000_fix_domain_insert_rls.sql` fixed for tags/triggers/variables/conversion_events was never applied to `containers` — it was still exploitable. Fixed in `20260827000000_fix_remaining_rls_gaps.sql`.
  2. **`organisation_members` INSERT RLS bug (found while fixing #1, not in the original audit).** Its INSERT policy's subquery is `FROM public.organisation_members` unaliased, which shadows the outer NEW row by name — the same tautology bug, differently shaped. Any admin/owner of one org could insert a membership row (any role, including `owner`) into a completely unrelated org. Also fixed, and a `WITH CHECK (role <> 'owner' …)` was added to the table's UPDATE policy to close a related gap where an admin could set `role: 'owner'` directly via the API, bypassing the app-level rule that ownership transfer isn't exposed through normal role editing (`MemberRow.tsx`).
  3. **Snippet injection.** `value_param`/`display_name` were interpolated raw into copy-paste JS snippets meant for a customer's live site (`src/features/conversions/lib/snippets.ts`) — an embedded quote or newline could execute arbitrary JS once pasted. Now escaped as proper JS string literals / stripped of line breaks, with matching DB `CHECK` constraints and client validation, plus two adversarial regression tests.
  4. **Accessibility, small items only.** Added live-region roles to loading/error/empty states so they announce to screen readers, labels on the four search inputs, `aria-current` on the active sidebar item, and fixed a skipped heading level in `EntityRow.tsx`. A modal-dialog accessibility rewrite and a color-contrast pass on the text/status color tokens were also drafted during the audit but deliberately reverted at my request — not wanted for this pass.
  5. Also enabled `enable_confirmations` in `supabase/config.toml` (was `false`, violating security-floor #4), and deleted a stray 0-byte `testfile.md` plus two unreferenced Vite/React scaffold SVGs.
- **Consequences:** `npm run lint`/`typecheck`/`test` all pass (36/36 tests, up from 34). Left untouched deliberately: the missing `@/` import alias, a duplicated `SELECT_CLASSES` Tailwind constant, and the absent TanStack Query/Zustand/router layer that `CLAUDE.md`'s coding-conventions section already mandates but the stack section still marks "open" — real findings, but either a large mechanical sweep across many files or a new-dependency decision, both reserved for deliberate review rather than folded into an audit pass. Worth reconciling that "mandatory" vs. "open" mismatch in `CLAUDE.md` itself in a future pass. The modal dialog-semantics gap (no `role="dialog"`, no focus trap, no Escape-to-close) and the failing color contrast on `text-tertiary`/`text-faint`/light-mode `success`/`warning` are both still open — noted here so they don't quietly disappear from the record.

---

## ADR-0028 — GTM's built-in variables added to Preview's Variables tab, still bounded by the no-real-page rule

- **Date:** 2026-08-26
- **Status:** Accepted (extends ADR-0019)
- **Context:** A Tag Assistant screenshot showed a populated Variables tab (Page Hostname/Path/URL, Referrer, Click Classes/ID/Target/Text/URL, Scroll Depth Threshold/Units/Direction, Container ID, Event); asked for Preview's Variables tab to match. `VariablesTab.tsx` (ADR-0019) resolves known variable types correctly, but the GTM Admin API's `variables` endpoint only returns container-defined custom variables — GTM's ~30 built-ins are never returned, so none of the screenshot's rows could appear regardless of resolution logic. Two options: add the built-ins, or broaden resolution of custom types beyond Constant/Data-Layer/Auto-Event (URL, DOM Element, Cookie, Custom JS show unresolved even when configured correctly). Chose to add the built-ins.
- **Decision:** Hardcoded `BUILT_IN_VARIABLES` (26 entries) in `simulator.ts`, mirroring ADR-0019's `BUILT_IN_TRIGGERS` pattern. `resolveVariable()` gained a `builtin` branch resolving each from the same `gtm.*` dataLayer keys the existing simulated actions already populate. ADR-0019's boundary held: Page URL/Hostname/Path and Referrer read off a real loaded page, which this simulator still never does (the unbuilt "firing verification" feature) — those four stay unresolved, now with the specific reason "Needs a real loaded page — not available in simulation". `VariablesTab.tsx` merges container variables and built-ins into one alphabetical list, matching Tag Assistant. 6 new Vitest tests cover the resolved built-ins and the unresolved reason.
- **Consequences:** Variables tab now looks much closer to real GTM output without weakening ADR-0019's honesty guarantee — nothing is guessed from TagOps Pro's own URL, relevant to the tracking-platform safety rules. Coverage is capped at what simulated actions produce (Click*, Form*, Scroll*, Error*, Video*, History); Random Number, Container Version, Environment Name, and AMP-specific built-ins were left out rather than fabricated. Broadening resolution of custom DOM/JS/Cookie/URL variable types remains undone.

---

## ADR-0027 — Light/Dark/System theme, via a token-swap rather than a second stylesheet

- **Date:** 2026-08-25
- **Status:** Accepted
- **Context:** The app was dark-only: `index.css`'s `@theme` block defined canvas/surface/border/text/accent/status colors as fixed hex values. Asked for a Light/Dark/System switch. Scoping found ~43 hover/active/ring states across 18 components were hardcoded `bg-white/N`/`border-white/N`/`ring-white/N` (plus a few `rgba(255,255,255,…)` shadows and the scrollbar thumb) — all lighten a surface, backwards on a light background. Left alone, light mode would ship with invisible or inverted hover states.
- **Decision:** Token-level theming: kept every custom property name (`--color-canvas`, `--color-surface-*`, `--color-text-*`, `--color-accent`, `--color-success/warning/danger`), added light values under `@media (prefers-color-scheme: light) { :root:not([data-theme]) {…} }` plus explicit `:root[data-theme="light"]`/`"dark"` blocks. Added `--color-overlay` (white in dark, black in light) in `@theme`, generating `bg/border/ring-overlay/N` utilities to replace `white/N`; renamed every hardcoded `white` overlay utility across the 18 files, and converted hand-written `rgba(255,255,255,…)` shadows to `color-mix(in srgb, var(--color-overlay) N%, transparent)`. Light-mode accent/success/warning/danger were darkened (e.g. accent `#8b8ef7` → `#5b52e0`) since several serve as button-background-with-light-text. New `ThemeContext` (`src/lib/ThemeContext.tsx`) holds `light | dark | system`, persists to `localStorage`, applies `data-theme` on `<html>` synchronously in `main.tsx` before first render to avoid a flash. Added a three-way control in a new "Appearance" section under Profile in Settings.
- **Consequences:** Components already using semantic tokens got light-mode support free. `CategoryBadge.tsx`'s dot colors were left as fixed Tailwind colors (400-weight reads clearly either way). Verified visually in both themes via a temporary bypass in `App.tsx` (Playwright screenshots), fully reverted — `git diff` on `App.tsx` is empty. Any future component reaching for `white/N` directly instead of `overlay` will silently break in light mode — worth a lint rule or a `CLAUDE.md` callout.

---

## ADR-0026 — Disambiguated the organisation_members → users embed

- **Date:** 2026-08-19
- **Status:** Accepted
- **Context:** After ADR-0025's fix, org creation worked and Settings loaded — but showed "Could not embed because more than one relationship was found for 'organisation_members' and 'users'". `organisation_members` has two FKs into `users` (`user_id`, `invited_by`), so `listOrganisationMembers()`'s bare `users(display_name, avatar_url, email)` embed was ambiguous. That query was one of two promises in a `Promise.all` inside `SettingsView`'s loader, so its rejection meant `getOrganisation()`'s result never got applied either, leaving the org name field empty — which looked like Chrome autofill, making "I can't rename my organisation" look like a separate bug.
- **Decision:** Changed the select to `users!user_id(display_name, avatar_url, email)`, telling PostgREST which FK to embed through. Added `autoComplete="off"` to the org-name input and made the Save button's disabled check explicitly require `organisation` to be loaded (`!organisation || …`).
- **Consequences:** One-line fix, no schema change. General rule: any table with more than one FK to the same target needs an explicit `!column` qualifier on every embed.

---

## ADR-0025 — Fixed the actual "cannot create an organisation" bug: INSERT ... RETURNING vs. a same-statement trigger

- **Date:** 2026-08-19
- **Status:** Accepted
- **Context:** With ADR-0024's fix, "Create organisation" surfaced its real error: `new row violates row-level security policy for table "organisations"`. Live-debugged against production (SQL Editor, `pg_policies`, `set_config('request.jwt.claims', …)` to impersonate the user). Ruled out: broken policy text (byte-for-byte correct), an invalid JWT (decoded — valid), and `auth.uid()` failing to resolve (confirmed correct immediately before the insert). Remaining variable: `RETURNING`. `createOrganisation()` chained `.select().single()`, asking PostgREST for `INSERT ... RETURNING`. Postgres re-checks a `RETURNING` row against the table's SELECT policy ("members can select organisations", `is_active_org_member(id)`) — for a brand-new org, only `auto_owner_membership()`'s own insert into `organisation_members` (a side effect of the same statement) makes that pass. Confirmed: the identical insert succeeded with no `RETURNING`. Specific to org creation — every other insert-then-select is done by someone already a member, whose pre-existing membership satisfies the policy immediately.
- **Decision:** Rewrote `createOrganisation()` (`src/features/organisation/api/organisation.ts`) to insert without `.select()` (PostgREST uses `Prefer: return=minimal`, skipping the RETURNING/SELECT-policy check), then a separate follow-up `SELECT ... WHERE slug = …`. By then the insert has committed, the trigger's membership row exists, and the SELECT policy passes. No migration or policy change needed.
- **Consequences:** Should now work end-to-end. General pattern: any insert whose SELECT-policy eligibility depends on a trigger fired by that same insert needs this two-step treatment. Test rows (`test-org-9995` etc.) were cleaned up manually via SQL Editor.

---

## ADR-0024 — Fixed a codebase-wide bug that silently swallowed every Supabase error message

- **Date:** 2026-08-19
- **Status:** Accepted
- **Context:** Testing ADR-0023's "Create organisation" flow failed with a generic "Failed to create your organisation." — a hardcoded fallback. Traced to a bug present since the first Supabase-backed feature: PostgREST's `{ data, error }` returns `error` as a plain object (`{message, code, details, hint}`), not a real `Error` — `postgrest-js` only builds a real `PostgrestError` when `.throwOnError()` is called, which nothing here does. Every api function did `if (error) throw error`; every consumer did `catch (err) { err instanceof Error ? err.message : 'generic fallback' }` — so every Supabase-originated error across Conversions, Settings, Organisation, and `lib/organisation.ts` has been silently replaced with a hardcoded fallback since the feature was built, hiding the real cause of the org-creation failure.
- **Decision:** Added `toError()` to `src/lib/supabase.ts` — wraps a plain `{message}` error into a real `Error`, passes a real `Error` through unchanged. Replaced every `throw error` (and `throw error.code !== '23505' ? ...`-guarded variants) across `lib/organisation.ts`, `features/organisation/api/organisation.ts`, `features/settings/api/settings.ts`, and `features/conversions/api/conversions.ts` with `throw toError(error)`. Confirmed `AuthError` genuinely extends `Error` via `@supabase/auth-js` source, so `Login.tsx`'s two OAuth `throw error` sites were left untouched.
- **Consequences:** Every `err instanceof Error ? …` check now works as intended — the next Supabase failure surfaces the real Postgres/PostgREST message. This fixes the app's ability to report the cause, not the cause itself — needs a retry against the live project. Any future Supabase api function must route its `throw` through `toError()`.

---

## ADR-0023 — Organisation onboarding gate + shareable invite codes for self-service "join"

- **Date:** 2026-08-18
- **Status:** Accepted — **migration not yet applied to the live Supabase project** (see Consequences)
- **Context:** ADR-0022's Settings page surfaced a gap: `Dashboard.tsx` never checked for an `organisation_members` row on a signed-in user. `handle_new_user()` mirrors sign-ins into `public.users`, but nothing creates an org or membership — invisible only because the one test account had been manually granted access to the seeded demo org; any other sign-in would hit "No organisation membership found" with no way out. Asked for the ability to create or join an org from Settings. "Create" was schema-supported (`authenticated users can create organisations` policy + `auto_owner_membership()` trigger); "join" had none. Chose a self-service invite code over admin-adds-by-email alone (ADR-0022).
- **Decision:** New migration `20260818000000_organisation_invite_codes.sql` adds `organisations.invite_code`, kept off the plain RLS surface — "members can select organisations" would let any viewer read it. Column-level `SELECT`/`UPDATE` on `invite_code` is revoked from `authenticated`; access goes only through three `SECURITY DEFINER` functions, each re-checking role internally: `get_invite_code`/`regenerate_invite_code` (owner/admin, code generated lazily on first request) and `redeem_invite_code` (any authenticated user; inserts an `editor` membership with no expiry, no-op if already a member). Revoking column SELECT forced `getOrganisation()`/`updateOrganisationName()` (ADR-0022) off `select('*')`/`select()` onto an explicit column list (`OrganisationSummary`, `Omit<Organisation, 'invite_code'>`). New `src/features/organisation/` feature: `OrganisationOnboarding` (full-screen pre-`AppShell` Create/Join gate, styled like `Login.tsx`) and `OrganisationView` (org details plus, for owner/admin, the invite code with copy/regenerate, via a new "Invite teammates" button in Settings). `Dashboard.tsx` checks membership via a new non-throwing `checkMyMembership()` (alongside the throwing `getMyMembership()` in `lib/organisation.ts`) and renders `OrganisationOnboarding` for zero-membership sessions, distinct from a fetch-error retry screen.
- **Consequences:** A user can only belong to one org via this UI — `getMyMembership()`'s `.limit(1)` has no "active org" switcher, so multi-org stays schema-possible, not built. **Migration not yet run against the live Supabase project** — until it is, "Join with code" and "Invite teammates" fail (missing RPCs). Second migration in a row touching `public.users`/`organisations` access at column/function level rather than plain RLS — flag with ADR-0022's `users` SELECT widening in `docs/05-security-review.md`.

---

## ADR-0022 — Settings page with real team management, closing the MVP "add/remove people + expiry" requirement

- **Date:** 2026-08-09
- **Status:** Accepted — **migration not yet applied to the live Supabase project** (see Consequences)
- **Context:** The user asked for a Settings/Profile page. `docs/02-requirements.md` lists "Add/Remove people from the Account" and "Add an expiry date for people" as MVP must-haves; the schema (ADR-0004/0005: `organisation_members` with `role` + `expires_at`, full RLS) has existed since Week 5–6 with no UI. Two RLS gaps blocked a real team list: `public.users` only allows selecting your own row, so joining `organisation_members` to `users` returns every teammate's name/email/avatar as null; and adding someone by email requires looking up a user who by definition isn't a teammate yet.
- **Decision:** New migration `20260809000000_settings_team_management.sql`: an additive `users` SELECT policy ("anyone who shares an organisation with you can see your basic profile", scoped to shared membership, not a directory); a `find_user_by_email(lookup_email)` SECURITY DEFINER function (grant restricted to `authenticated`, returns only `id`/`display_name`/`avatar_url`/`email` for an exact match) so "add by email" avoids full user enumeration. New feature `src/features/settings/` (`api/settings.ts`, `SettingsView`/`MemberRow`/`AddMemberModal`): a read-only profile card from the Google OAuth session (not `public.users`, which has no UPDATE policy); an organisation-name field editable only by the owner; a team list with per-row role change, expiry date, and remove, gated in the UI by caller role (owner/admin) with RLS as the real enforcement. "Owner" isn't assignable here and the owner row is display-only. `getCurrentOrganisationId`/`generateDisplayId` were promoted from `conversions/api/conversions.ts` to a new `src/lib/organisation.ts`, extracted as `getMyMembership()` (now also returning role). Reached via the sidebar's existing profile row, not a new `NAV_ITEMS` item.
- **Consequences:** "Add a member" only works for someone who has already signed in to TagOps-Pro at least once — inviting a never-signed-up user needs a separate pending-invite-plus-email system (a Supabase Edge Function), a follow-up. **Migration not yet run against the live Supabase project** — until then, the team list and "Add member" fail with a permissions/RPC-not-found error. `src/types/supabase.ts` gained hand-authored `users`/`organisations` types and a `find_user_by_email` `Functions` entry (same no-CLI caveat as ADR-0012/0013). Worth a `docs/05-security-review.md` entry: the widened `users` SELECT policy is the one new cross-user data exposure.

---

## ADR-0021 — Native desktop app as an Electron shell in `desktop/`, with sign-in through the system browser

- **Date:** 2026-07-13
- **Status:** Accepted (extends ADR-0020; the PWA and web app remain unchanged)
- **Context:** After the PWA (ADR-0020), the user asked for "an application separate to a website" — an off-mandate extra (the AT3 deliverable is still the Vercel web app) — so the constraint was a true desktop target without a second codebase or fighting Google's hard block on OAuth inside embedded app webviews (`disallowed_useragent`).
- **Decision:** A self-contained **Electron** shell in `desktop/` (own `package.json`; Electron over Tauri — no Rust toolchain, boring and well-documented). It serves the same built web app (`dist/`, bundled as `resources/renderer`) over a private `tagops://` protocol registered standard+secure, giving the renderer a real origin (so Supabase localStorage sessions work) without a local server or `file://` quirks. Sign-in never happens inside the app window: the renderer calls `signInWithOAuth` with `skipBrowserRedirect` and `redirectTo: http://127.0.0.1:53682/auth/callback`; the main process opens that URL in the system browser and runs a one-shot loopback server catching the returning `?code=`, exchanged via `exchangeCodeForSession` — requiring the shared Supabase client to switch to the **PKCE flow** (`src/lib/supabase.ts`), also the recommended flow for the web app, unaffected. The preload bridge exposes exactly one function (`window.desktopAuth.signIn`), isolating the renderer from Node/IPC; external navigation goes to the system browser. Packaged via electron-builder (`npm run desktop:package` → unsigned `TagOps Pro.app`). Electron pinned to ≥43 to clear `npm audit` advisories.
- **Consequences:** One codebase, three delivery forms. `http://127.0.0.1:53682/auth/callback` must be added to Supabase → Authentication → Redirect URLs, or desktop sign-in bounces. Not part of the AT3 submission — must be presented as an extra. Follow-ups: no CSP meta yet (needs allow-listing Supabase/Google endpoints), the app is unsigned (distribution needs an Apple Developer identity), and `desktop/` has no automated tests.

---

## ADR-0020 — Installable PWA rather than a native desktop app

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** The user wanted TagOps-Pro to be "an application, not a website". A native desktop binary (Tauri/Electron) would deviate from the mandated stack — off-stack changes needed teacher approval by end of Week 3 — and complicate Google OAuth. The need was the app feeling like an app: its own window, icon, no browser chrome.
- **Decision:** Made the app an installable PWA with static assets only: `public/manifest.webmanifest` (name, `display: standalone`, dark theme/background colours matching the canvas token, 192/512 `any` + 512 `maskable` icons) linked from `index.html` alongside `theme-color` and iOS Add-to-Home-Screen metadata. Icons rasterised from `favicon.svg` on the app's dark surface colour. No service worker: Chrome no longer requires one for installability, offline is meaningless for an app whose data is the live GTM API, and stale-cache bugs around the OAuth redirect are a real risk for no benefit — revisit only if offline shell caching becomes a genuine requirement (via `vite-plugin-pwa`).
- **Consequences:** Chrome/Edge users get an install prompt; iOS users can Add to Home Screen. Still the same Vercel deployment — one codebase, no new dependencies. `index.html`'s title was corrected from `tagops-pro` to `TagOps Pro`, since it becomes the installed app's window title.

---

## ADR-0019 — Preview mode as a local simulation, not a page-injected debugger; Vitest adopted for its tests

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** The user asked for "a preview mode like GTM". GTM's real preview injects a debug script into the live site and observes actual events — replicating that means writing to the user's site, colliding with the read-only-by-default safety rules and beyond MVP scope. The useful part for this audience (non-technical owners) is the explanation: which tags fire on which events, and why the rest didn't.
- **Decision:** Built preview as a pure client-side simulation (`src/features/preview/lib/simulator.ts` + `components/`). Loads real tags/triggers from the GTM API (read-only, cached), replays GTM's page-load sequence (`gtm.init_consent` → `gtm.init` → `gtm.js` → `gtm.dom` → `gtm.load`), and lets the user push simulated interactions (clicks, form submits, scroll, custom dataLayer events with a JSON payload), reporting per-tag status — fired/not fired/paused/blocked — with the matching trigger named, plus a data-layer inspector. GTM's implicit triggers (All Pages `2147479553`, Initialization `2147479573`, Consent Init `2147479572`) resolve from fixed IDs since the API never returns them. Honesty rule: trigger conditions ("Page URL contains /checkout") can't be evaluated without a real page, so they're surfaced as "N conditions not evaluated" rather than guessed; the shallow data-layer merge is likewise called out in a comment. As dataLayer logic, `CLAUDE.md`'s unit-test rule applies — **Vitest** was installed (unit-tier testing decided; Playwright for smoke remains open), 23 tests in `tests/unit/` covering trigger matching (incl. regex custom events and invalid-regex safety), built-in trigger resolution, pause/block precedence, and data-layer accumulation. `test`/`test:watch`/`typecheck` scripts added to `package.json`.
- **Consequences:** Preview can honestly answer "which tags would fire" but not "does my site actually push this event" — that stays the roadmap "firing verification" feature, kept visible via the UI's "events are simulated locally, no real hits are sent" framing. The built-in trigger ID table and trigger-type→event map must grow if Google adds trigger types. Vitest is a new devDependency installed without a same-day ask (flagged for review), though already the planned default.

---

## ADR-0018 — Google Ads conversion tracking completed end-to-end in the UI

- **Date:** 2026-07-11
- **Status:** Accepted (closes the follow-up from ADR-0015)
- **Context:** ADR-0015/0016 added the schema and list UI for Google Ads conversions, but no screen could set a container's `google_ads_conversion_id` (only settable in Supabase directly), the label had no client-side validation, and after linking there was no way to get tracking code onto a site.
- **Decision:** Three additions in the conversions feature: `GoogleAdsSettingsModal`, opened from a status chip in the picker bar (green with the `AW-` ID when linked, amber otherwise), writes the ID via new `updateContainerGoogleAdsId()` — validated against the same `^AW-[0-9]{6,}$` pattern the CHECK constraint enforces, giving an actionable message instead of a raw 23514. Conversion-label validation (`^[A-Za-z0-9_-]{4,}$`) in the event form. A per-event "Code" action opens `ConversionSnippetModal`, generating copyable code from `src/features/conversions/lib/snippets.ts` in two flavours — the direct `gtag('event','conversion',{send_to:…})` call Google Ads' setup flow hands out, and a `dataLayer.push` variant for GTM-owned pages — real IDs when linked, marked placeholders plus a warning banner when not. Snippet generation is pure and unit-tested.
- **Consequences:** "Needs setup" states are now fixable inside the app instead of requiring database access. The generator emits placeholders (`'value': 0, // TODO`) rather than guessing amounts, so a copy-paste without reading can't silently misreport conversion values. A new "Linked to Google Ads" stat surfaces the unlinked backlog.

---

## ADR-0017 — App-wide GTM selection context with a cached API layer; `set-state-in-effect` lint rule parked

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** All four GTM-backed views (Tags, Triggers, Variables, Conversions) carried a private copy of the same ~70 lines: fetch accounts, fetch containers, own selection state, render the picker bar. Switching sections refetched identical data and dropped the user's account/container choice — the most visible UX papercut — while multiplying calls against the GTM API's per-minute quota.
- **Decision:** Selection now lives once in `GtmProvider` (`src/lib/GtmContext.tsx`, mounted in `AppShell`), with one shared `ContainerPicker` component. `lib/gtm.ts` gained a 60-second TTL cache keyed by URL+token-suffix, storing the in-flight promise (deduping concurrent requests; failures evicted immediately). The Sync button clears the cache and bumps a context `refreshKey` every view's load effect depends on. Views keep owning workspace-level data — only the account/container layer moved up. Also turned off `react-hooks/set-state-in-effect` (12 pre-existing errors, ADR-0013's noted debt) in `eslint.config.js` with an explanatory comment: it flags the standard fetch-on-mount pattern every view uses, and the real fix is the planned move to TanStack Query, not per-line suppressions. `npm run lint` is clean again.
- **Consequences:** Selection persists across views; repeat visits render instantly from cache (60s staleness, explicit Sync for freshness). New GTM-backed views get the picker and caching free — Preview (ADR-0019) was built on this. A module-level cache means components asking for the same resource share fate (intended); the lint rule is debt-by-choice, due back (or moot) when TanStack Query lands, which would also subsume the hand-rolled cache.

---

## ADR-0016 — Conversions scoped by a live GTM container picker, auto-provisioning the Supabase row

- **Date:** 2026-07-10
- **Status:** Accepted (extends ADR-0015)
- **Context:** After ADR-0015's migration, Conversions still showed "No containers found for your organisation yet" for the real account. Cause: nothing writes to Supabase's `containers` table for a real org — only `supabase/seed.sql` populates it, for the fictional demo org. Tags/Triggers/Variables sidestepped this by reading live from the GTM API instead (see `docs/ai-use-log.md`, 10/07/2026); Conversions was the one feature depending on a row nothing created. Separately, the user asked for the list to look like Google Ads' own conversion-action UI (goal-style cards by category, table underneath), raising a second issue: Google Ads' table shows live metrics (All conv., All conv. value) TagOps-Pro can't produce (the roadmap "verify firing" feature, out of MVP scope per `docs/02-requirements.md`).
- **Decision:** Two choices put to the user before building: (1) add the same live GTM Account → Container picker Tags/Triggers/Variables use, auto-provisioning the matching `containers` row (upsert-by-`(organisation_id, gtm_container_id)` via new `ensureContainerForGtmContainer()` in `src/features/conversions/api/conversions.ts`) on first selection, over a manual "add container" form; (2) swap "All conv."/"All conv. value" for fields TagOps-Pro tracks (Ads ID/Label, Value + Currency) rather than fabricated placeholders. A new `getCurrentOrganisationId()` resolves the org via `organisation_members` (added to `src/types/supabase.ts`). The list is now grouped into per-category cards (new `conversion` kind on `CategoryBadge`) with a real `<table>` underneath, and a "Ready"/"Needs setup" pill flagged only when an event has a Conversion Label but no Conversion ID on its container — a real, checkable misconfiguration.
- **Consequences:** Conversions is now consistent with Tags/Triggers/Variables in container selection, while remaining the one feature whose records are Supabase-native — GTM has no concept of conversion label or category. `ConversionFormModal` lost its container dropdown (now ambient page-level context); `ConversionCard.tsx` was replaced by `ConversionTableRow.tsx`. Auto-provisioning means selecting a container here has a side effect (an INSERT on first use) other pickers don't — deliberate and RLS-scoped, worth flagging at the walk-through.

---

## ADR-0015 — Google Ads Conversion ID lives on containers, not conversion_events

- **Date:** 2026-07-10
- **Status:** Accepted
- **Context:** The Conversions page only modelled GA4 events. Extending to Google Ads meant placing two new fields: the Conversion ID (`AW-XXXXXXXXX`, Google Ads' account-level identifier, shared by every conversion action) and the Conversion Label (unique per action). Two placements for the ID: on `containers` (matching `gtm_container_id`/`ga4_property_id`) or denormalised onto `conversion_events`. Confirmed with the developer: one TagOps-Pro container never maps to more than one Google Ads account, same as GTM/GA4.
- **Decision:** Added `google_ads_conversion_id text` to `containers` (nullable, `CHECK ^AW-[0-9]{6,}$`). Added `conversion_label text` (nullable, free text) and `category text NOT NULL DEFAULT 'other'` (`CHECK` against Google Ads' 15 categories: Purchase, Add to cart, Begin checkout, Subscribe, Qualified lead, Converted lead, Submit lead form, Book appointment, Sign up, Request quote, Get directions, Outbound click, Contact, Page view, Other) to `conversion_events`. New migration `20260710000000_google_ads_conversion_tracking.sql` — `20260601000000_init_schema.sql` untouched. No new RLS: both tables already scoped by `organisation_id` via `is_active_org_member()`.
- **Consequences:** Setting the Conversion ID has no UI yet — read-only in the Conversion form, settable only directly in Supabase; a follow-up. `category` defaults to `'other'` rather than nullable, since the list groups by category and needs a fallback bucket regardless. A future multi-Google-Ads-account requirement would need the ID moved to `conversion_events` or a join table.

---

## ADR-0014 — Adopt Tailwind CSS for styling (Linear-style visual redesign)

- **Date:** 2026-07-10
- **Status:** Accepted
- **Context:** The UI was functional but ad hoc — 16 per-component `.css` files with hand-picked hex values repeated across files (e.g. `#0d1120`, `#1a2035`, `#2dd4bf` dozens of times, no shared source of truth). The user asked for a "Linear-style" redesign (near-black layered surfaces, hairline borders, tight typography, fast subtle motion, visible focus rings) across every screen. A utility-first framework speeds applying a consistent spacing/radius/color scale across ~15 components in one pass, and Tailwind's `@theme` (v4) doubles as the needed token system.
- **Decision:** Adopted Tailwind CSS v4 via `@tailwindcss/vite`, not v3's PostCSS + `tailwind.config.js`. This project runs Vite 8 with Rolldown; the v4 plugin needs no separate PostCSS config or content-globbing file. Design tokens (surface levels, text levels, accent, border) are declared once as CSS custom properties in `src/index.css`, exposed via `@theme`, consumed as utilities everywhere. Per-component `.css` files were deleted as styles migrated to inline utilities; anything that doesn't map cleanly (Google Fonts `@import`, base tokens, keyframes) stays in `src/index.css`.
- **Consequences:** Purely visual — no Supabase queries, RLS, routing, or props change. Adds one dependency family (`tailwindcss`, `@tailwindcss/vite`), within ADR-0003's styling latitude. Future components default to Tailwind utilities, extracting a `.css` file or class-string constant only when a utility string repeats more than twice or exceeds ~6 utilities.

---

## ADR-0013 — Variables and Conversions built on the same Supabase-backed CRUD pattern as Triggers; Home unlocked

- **Date:** 2026-07-09
- **Status:** Accepted (extends ADR-0012)
- **Context:** Following ADR-0012, the user asked to link every page from Home and remove remaining "Coming soon" placeholders. Variables and Conversions were static placeholder tables, like Triggers had been. Their tables (and RLS) already existed, already covered by ADR-0012's RLS fix and seed-access grant.
- **Decision:** Replicated the Triggers pattern: hand-authored `Database` types for `variables`/`conversion_events` in `src/types/supabase.ts`, an `api/` layer per feature, a card + create/edit modal, and a real `View`. `HomeView.tsx`'s section cards dropped the `live`/"Soon" flag entirely since every section is now operational.
- **Consequences:** All four data-driven sections are now reachable and functional, though Tags remains architecturally different (live GTM mirror) per ADR-0012. `react-hooks/set-state-in-effect` now also fires in `VariablesView.tsx`/`ConversionsView.tsx`, replicating the established pattern intentionally. Fixing it properly across all four views (and Tags) is a good follow-up before Week 6–7 hardening.

---

## ADR-0012 — Triggers implemented as Supabase-backed CRUD, not a GTM API mirror

- **Date:** 2026-07-09
- **Status:** Accepted
- **Context:** Triggers was 100% static placeholder markup. Two paths: (a) mirror Tags — a live, read-only view via the GTM API's OAuth `provider_token`; or (b) build against the `triggers`/`tags`/`tag_triggers` schema already in `20260601000000_init_schema.sql` and `docs/04-data-model.md`, which had RLS and seed data but no application code.
- **Decision:** Built Triggers as real Supabase-backed CRUD (path b) — matches the documented data model and exercises RLS-protected writes end-to-end, first CRUD feature in the app. Two blockers fixed in the same change: (1) **RLS bug** — the INSERT policies on `tags`, `triggers`, `variables`, and `conversion_events` checked `where organisation_id = organisation_id` inside a subquery against `organisation_members` — a tautology, letting any editor/admin/owner of any org insert a row tagged with a different org's id. Fixed in `20260610000000_fix_domain_insert_rls.sql` by qualifying the right-hand side with the target table's name, matching the UPDATE/DELETE policies. (2) **No real access to seed data** — `supabase/seed.sql` seeds a fake `auth.users` row unrelated to the real account, so RLS returned zero rows; fixed by appending a seed block granting the real account owner access to the seeded "Need Tracking" org, matched by email.
- **Consequences:** Triggers and Tags are now architecturally inconsistent (Supabase CRUD vs. live GTM sync) until Tags migrates. `src/types/supabase.ts` was hand-authored for `containers`/`tags`/`triggers`/`tag_triggers` rather than generated via `supabase gen types typescript` (no CLI/project link available) — regenerate once set up. The tautology bug warrants a matching check on any future policies copy-pasted from these.

---

## ADR-0011 — Third-party outage risk: Supabase platform incident blocked local dev

- **Date:** 2026-07-06
- **Status:** Accepted (informational — no architectural change)
- **Context:** `npm run dev` hung indefinitely on the loading spinner. Diagnosis (`docs/ai-use-log.md`) traced two stages: a stale/misresolving DNS lookup for the Supabase URL, then a Cloudflare 521 ("Web server is down") from `nkdkfbejsswgllbzjhvd.supabase.co`. The dashboard showed "Healthy" but with an active banner: "We are investigating a technical issue." status.supabase.com confirmed an ongoing incident ("Project status change failures in multiple regions", started 2026-06-30, unresolved as of 2026-07-04) listing `ap-southeast-1` (this project's region) among affected regions.
- **Decision:** No code change — `App.tsx`'s behaviour (block on `supabase.auth.getSession()` before rendering Login/Dashboard) is correct; the outage was entirely Supabase-side. Confirms a hard runtime dependency on Supabase's availability, with no fallback.
- **Consequences:** Local dev and any deployed environment are unavailable for the duration of a Supabase incident, with no graceful degradation — an infinite spinner rather than a timeout/error state. Worth a `getSession()` timeout before Week 6–7 hardening, surfacing "service unavailable, try again". This single-point-of-failure risk (mandated backend-as-a-service, no self-hosted fallback) belongs in `docs/05-security-review.md` and the Section 2 writeup, as a direct trade-off of the mandated stack (ADR-0003).

---

## ADR-0010 — organisations INSERT policy: auth.uid() IS NOT NULL

- **Date:** 2026-06-03
- **Status:** Accepted
- **Context:** The v2 migration spec changed the organisations INSERT policy from `auth.uid() = owner_id` (caller must set themselves as owner) to `auth.uid() IS NOT NULL` (any authenticated user can insert an org with any owner_id).
- **Decision:** Follow the spec: `auth.uid() IS NOT NULL` — simpler and sufficient for the MVP where users only create orgs for themselves. `auto_owner_membership()` still enforces `owner_id` is added as a member immediately after creation.
- **Consequences:** A technically motivated user could create an org with another user's `owner_id`, making them an owner of an org they didn't create — unlikely in the single-user MVP but needs tightening (revert to `auth.uid() = owner_id`) before multi-tenant launch to untrusted users. Flagged for `docs/05-security-review.md`.

---

## ADR-0009 — Sequence-generated placeholder display_ids in auth triggers

- **Date:** 2026-06-03
- **Status:** Accepted (supersedes ADR-0005's nullable display_id approach)
- **Context:** ADR-0005 made `display_id` nullable in `public.users`/`public.organisation_members` so `handle_new_user()`/`auto_owner_membership()` could insert without knowing the org-specific PREFIX_XX_NNNN code. The v2 spec instead wants a placeholder like 'USRID_XX_0000' — but a hard-coded literal breaks the UNIQUE constraint on a second signup.
- **Decision:** Created two sequences (`public.user_display_id_seq`, `public.member_display_id_seq`); trigger functions generate 'USRID_XX_NNNN'/'MEMID_XX_NNNN' from them, matching the `^[A-Z]{2}_[A-Z]{2}_[0-9]{4}$` CHECK and unique across rows. `display_id` stays NOT NULL; the app/seed later updates the placeholder to the real code via DO UPDATE.
- **Consequences:** Sequences persist across restarts, unaffected by re-running the migration (IF NOT EXISTS guards). Trade-off vs. nullable: stricter schema — every row always has a syntactically valid display_id. The seed must use DO UPDATE (not DO NOTHING) for the owner membership row and public.users, since triggers insert first.

---

## ADR-0008 — Seed UUID pattern: hex-prefix entity type encoding

- **Date:** 2026-06-03
- **Status:** Accepted (supersedes ADR-0006's second-group encoding)
- **Context:** The v2 seed spec asked for a "simple, readable pattern" (`a0000000-...-000000000001` for users, `b0000000-...-000000000001` for orgs). ADR-0006 used a different pattern (second group = entity type).
- **Decision:** Use first-group hex-prefix for entity type: a=users, b=organisations, c=members, d=containers, e=tags, f=triggers, 07=variables, 08=conversion_events; the last group is the zero-padded sequential record number. Example: `e0000000-0000-0000-0000-000000000001` = first tag (TAGID_AG_0001). Variables/conversion_events use two-digit numeric prefixes since the hex alphabet (0-9, a-f) is exhausted at f=triggers.
- **Consequences:** Self-documenting once the convention is known. The 07/08 prefix breaks the alphabetic run but stays unambiguous. UUIDs look obviously synthetic — the right signal for dev/test-only data.

---

## ADR-0007 — tag_triggers RLS uses subquery through tags (no organisation_id column)

- **Date:** 2026-06-01
- **Status:** Accepted
- **Context:** `public.tag_triggers` is a junction table with composite PK `(tag_id, trigger_id, relationship)` and no `organisation_id` column of its own, unlike every other domain table's `is_active_org_member(organisation_id)` policy.
- **Decision:** tag_triggers RLS resolves org context by subquery through `public.tags`: `is_active_org_member((SELECT t.organisation_id FROM public.tags t WHERE t.id = tag_triggers.tag_id))`. INSERT/UPDATE/DELETE policies join `public.tags → public.organisation_members` inline.
- **Consequences:** Slightly higher query cost per evaluation (one extra lookup through tags). No RLS recursion, since tags' SELECT policy calls `is_active_org_member()` (SECURITY DEFINER), bypassing RLS on organisation_members. The alternative — an `organisation_id` denormalisation column — would remove the subquery but duplicate data already enforced through the FK chain — rejected as unnecessary at this scale.

---

## ADR-0006 — Hard-coded deterministic UUIDs in seed.sql

- **Date:** 2026-06-01
- **Status:** Accepted
- **Context:** seed.sql required hard-coded UUIDs (no `gen_random_uuid()`) for reproducibility and cross-referencing. Needed a human-readable, unambiguous naming convention.
- **Decision:** UUID second group encodes entity type: `0001`=user, `0002`=org, `0003`=member, `0004`=container, `0005`=tag, `0006`=trigger, `0007`=variable, `0008`=conversion_event; last group is the sequential record number. Example: `00000000-0005-0000-0000-000000000001` = first tag (TAGID_AG_0001). Mapping documented in a comment block atop seed.sql.
- **Consequences:** UUIDs are valid, unique within the seed, and trivially re-derivable, and look obviously synthetic — the right signal for dev/test-only data. They will conflict if the same seed runs against a production database with real records sharing the same IDs, but seed.sql is explicitly dev/test only and should never run against live production.

---

## ADR-0005 — display_id nullable in public.users and public.organisation_members

- **Date:** 2026-06-01
- **Status:** Accepted
- **Context:** schema.sql declared `display_id NOT NULL` everywhere, including `public.users`/`public.organisation_members` — but both have SECURITY DEFINER auto-insert triggers firing before a display ID can be assigned: `handle_new_user()` fires on `auth.users INSERT` before any session or org context exists (the `USRID_XX_NNNN` code needs the org's two-letter code, unavailable at signup); `handle_new_organisation()` fires on `organisations INSERT` before the app can assign a `MEMID_XX_NNNN` code to the owner membership row it creates. NOT NULL would fail both.
- **Decision:** Made `display_id` nullable in these two tables only. The CHECK constraint stays — it doesn't fire on NULL. Other tables keep `display_id NOT NULL`, set explicitly at insert time. The app fills the real display_id during onboarding (users) or immediately after org creation (owner membership).
- **Consequences:** A freshly-signed-up user has `display_id = NULL` until onboarding completes; queries filtering/sorting by it must handle NULL. The seed uses `ON CONFLICT DO UPDATE SET display_id = excluded.display_id` (not DO NOTHING) for these two tables, since the triggers insert first.

---

## ADR-0004 — Replaced public.profiles with public.users as the auth mirror table

- **Date:** 2026-06-01
- **Status:** Accepted (supersedes migration 20260507141000_profiles.sql)
- **Context:** Migration `20260507141000_profiles.sql` created `public.profiles` with a `handle_new_user()` trigger targeting it. The data dictionary (`docs/04-data-model.md`), `seed-data/*.json`, and `seed-data/schema.sql` all use `public.users` instead, with a richer schema (`display_id`, `display_name`, `avatar_url`) — a direct conflict, since a migration built on `schema.sql` would fail with `profiles` already existing and `users` not.
- **Decision:** Dropped `public.profiles` (and its trigger/function) in the new migration `20260601000000_init_schema.sql`, created `public.users` in its place; `handle_new_user()` recreated to target it. `users` is more conventional for a Supabase auth mirror and matches the rest of the folio.
- **Consequences:** The profiles migration is effectively superseded. `DROP ... IF EXISTS` guards make the new migration safe on both a fresh and the existing project. Code written against `public.profiles` (none exists yet) would need updating.

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
- **Consequences:** No separate backend server to maintain; Supabase RLS becomes the primary authorisation mechanism. Auth via Supabase Auth with Google OAuth satisfies the "sign up in under 2 minutes" requirement. Tool choices must be defensible in Section 2 of the report and at the Week 10 walk-through. Several earlier "open questions" (backend, auth, hosting) are now settled.

---

## ADR-0002 — Documentation lives in `/docs` as Markdown

- **Date:** 2026-05-13
- **Status:** Accepted
- **Context:** Need a low-friction place to capture problem framing, requirements, decisions, and AI usage, versioned alongside the code so it doesn't drift. The AT3 brief also mandates a `/docs` folio.
- **Decision:** Use a `/docs` folder at the repo root with numbered Markdown files (`01-problem-statement.md`, `02-requirements.md`, etc.) plus `decision-log.md` and `ai-use-log.md`. No wiki, no separate doc tool.
- **Consequences:** Docs are reviewed in pull requests like code. The marking teacher reads them on GitHub or in the IDE. Revisit if a non-developer co-founder joins.

---

## ADR-0001 — Frontend stack: Vite + React + TypeScript

- **Date:** 2026-05-13
- **Status:** Accepted (inferred from existing `node_modules` and Vite scaffold README)
- **Context:** Need a productive frontend stack for a single-page web app with rich UI (dropdowns, lists of tags/triggers, account management). Solo developer, AI-assisted. The AT3 brief leaves frontend framework as my choice.
- **Decision:** Vite (Rolldown) + React + TypeScript, with ESLint and `@typescript-eslint`.
- **Consequences:**
  - Fast dev server and modern tooling out of the box.
  - TypeScript adds upfront friction but pays off when AI assistants reason about types — and when defending code at the walk-through.
  - Matches the StudyShare worked example, lowering the cost of borrowing patterns from it.
  - Still to decide: styling (Tailwind vs CSS modules), routing (React Router vs TanStack Router), state (Zustand vs Redux Toolkit vs TanStack Query alone), test framework (Vitest + Playwright is the default plan). See open ADRs below.

---

## Open Questions (to be turned into ADRs)

- **Styling system.** Tailwind, CSS Modules, or a component library (shadcn/ui, Mantine)?
- **State / data fetching.** TanStack Query + Zustand is the planned default; confirm before building the first feature.
- **Routing.** React Router or TanStack Router?
- **Testing framework.** ~~Vitest for unit/integration~~ — Vitest adopted for the unit tier (ADR-0019). Playwright for smoke still to confirm before Week 8.
- **OAuth scopes for Google Tag Manager / GA4.** Read-only is fine for the MVP; what does the verification feature on the roadmap need?
- **`decision-log.md` vs `decisions.md` filename.** AT3 spec uses `decisions.md`. Decide with teacher whether to align.
