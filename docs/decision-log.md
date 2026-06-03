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
- **Testing framework.** Vitest for unit/integration, Playwright for smoke — confirm before Week 8.
- **OAuth scopes for Google Tag Manager / GA4.** Read-only is fine for the MVP; what does the verification feature on the roadmap need?
- **`decision-log.md` vs `decisions.md` filename.** AT3 spec uses `decisions.md`. Decide with teacher whether to align.
