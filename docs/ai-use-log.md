# AI Use Log

A chronological log of substantive AI interactions on TagOps-Pro, kept per the AT3 AI Use Policy.

## Why this log exists (AT3 rules)

1. **Log every substantive Claude Code interaction.** Trivial autocomplete does not need logging; substantive prompts (architecture suggestions, schema design, debugging non-trivial issues, generating components, drafting docs) do.
2. **I must be able to defend every line of submitted code at the Week 10 walk-through.** Code I cannot explain is treated as not my work.
3. **I stay the engineer; AI is the assistant.** Decisions about product direction, scope, and architecture are mine. AI proposes; I dispose.

## Entry format

Each entry follows the schema defined in `CLAUDE.md` (AI Use Policy > Log entry format):

- **Title** — short subject line as a `###` heading.
- **Date** — DD/MM/YYYY.
- **Prompt** — what the user asked (verbatim if a single message; summarised if multi-turn).
- **Response summary** — what Claude returned, in my own words.
- **What you did with it** — Accepted / Modified / Rejected.
- **Why** — the reasoning behind that verb.

All entries below used **Claude Code (Claude Opus in Cowork mode)** unless otherwise noted. New entries go at the **bottom** of the file.

---

### Initial folio docs and first CLAUDE.md draft

**Date:** 13/05/2026

**Prompt:** Multi-turn — "look in the docs folder", then "yes draft starters" (problem statement, decision log, AI use log), then "what need to be done to configure Claude for this development project".

**Response summary:** Read the existing `docs/02-requirements.md`. Drafted `docs/01-problem-statement.md` with a four-pain framing and target-user definitions, `docs/decision-log.md` with a lightweight ADR template and two starter entries, and an initial `docs/ai-use-log.md`. Drafted a first `CLAUDE.md` at the repo root with a provisional Vite + React + TS + Tailwind + TanStack Query + Supabase stack, plus a six-step Claude-configuration plan.

**What you did with it:** Modified.

**Why:** Provisional stack guesses needed to be reconciled with the AT3 brief shared the next turn. Supabase happened to land correctly, but security-floor wording, AI-use policy text, and the exact folio file numbering required updating.

---

### Aligned project with AT3 orientation brief

**Date:** 13/05/2026

**Prompt:** Attached the Noetica Teach orientation PDF and said: "This is what we arw workin towards, please update as necessary". Then, mid-turn: "Don't rename documents".

**Response summary:** Rewrote `CLAUDE.md` to reflect the mandated stack (Vercel + Supabase + Claude Code + VS Code), the six-requirement security floor, the AI-use policy, the nine-week IU timeline, the required repo shape (with `supabase/migrations/`, `supabase/functions/`, and the three-tier `tests/` structure), and the marking structure. Updated `docs/01-problem-statement.md` with an academic-context note. Reformatted this log to the AT3 schema. Added ADR-0003 to `docs/decision-log.md` recording the now-mandated stack. Replaced the default Vite scaffold `README.md` with a real project overview.

**What you did with it:** Modified.

**Why:** The initial `CLAUDE.md` was based on stack guesses; the PDF made several things non-negotiable. The mid-turn override (kept `decision-log.md` rather than rename to the AT3-spec `decisions.md`) is a defensible preference to defer until the teacher confirms — flagged as an open question in the decision log.

---

### Initial data-model draft (rejected as too dense)

**Date:** 13/05/2026

**Prompt:** "Give me a suggested data dictionary for all the necessary information".

**Response summary:** Drafted a comprehensive first version of `docs/04-data-model.md` (~270 lines) covering full relational schema, an ASCII entity-relationship overview, table-by-table column definitions for the 11 MVP tables, three roadmap tables, an RLS approach section with a helper function, indexing notes, and eight open questions for Weeks 5–6.

**What you did with it:** Rejected (in form); substance reused.

**Why:** The per-table relational format was correct for a Week 5–6 schema doc but wrong for a Week 2 data dictionary. The entities, fields, and constraints carried over wholesale into the rewrite in the next turn — only the presentation changed.

---

### Rebuilt 04-data-model.md as a user-format Data Dictionary

**Date:** 13/05/2026

**Prompt:** Shared a screenshot of own first-draft data dictionary and said: "No simplfy 04-data-model. Also its for a data dictionary so I don;t know whats the title is about. Also see mine for inspiration. Use the table structure, mine is a very rough draft and likely needs to be tweaked but noneless use for inspo and give me your suggested structure at the bottom of the file".

**Response summary:** Rebuilt `docs/04-data-model.md` in the seven-column row-per-field format from the screenshot (Variable | Data Type | Format | Description | Example | Connected to | Validation), one entity per section. Retitled the doc as "Data Dictionary" for clarity. Pushed the relational schema, RLS helper, and roadmap entities to a condensed "Suggested Structure" section at the bottom. Marked Password as handled by Supabase Auth, never stored in our database (security floor #6). Tweaked `CON_XX_YYYY` → `CONID_XX_YYYY` for internal consistency with the other ID prefixes.

**What you did with it:** Accepted.

**Why:** The chosen format is more readable for non-technical readers (including the marking teacher). The relational thinking is preserved but de-emphasised. The Password-row treatment is a deliberate teaching moment for the Week 6–7 security review.

---

### Created worked examples folder for the data dictionary

**Date:** 13/05/2026

**Prompt:** "are you able to actually create this data dictionary. Put one log/row for each dictionary and each dictionary should have its own page. Make a folder to hold these. I just want to see what it would look like in reality".

**Response summary:** Created `docs/data-dictionary-examples/` containing ten files — one per entity plus a README. Each file held a single populated example record with consistent cross-references via display IDs, all sharing one scenario (Alex G owns the Need Tracking org; one container; one tag, trigger, variable, conversion event; one tag–trigger link).

**What you did with it:** Modified the next turn (FK gaps fixed and layout switched to row-per-record).

**Why:** Concrete example data beats abstract schema for explaining a data model. The single shared scenario is what made the worked examples valuable — without it, each file would be standalone and would not show how the entities actually relate.

---

### Fixed FK integrity gaps and switched to row-per-record layout

**Date:** 13/05/2026

**Prompt:** First, asked whether the worked examples would be functional and whether they could be made into CSVs. After Claude identified two FK gaps: "Make the necessary changes outlined in 1 and 2, cool I'd probable want a row for each record not the specific categories. Like my initial photo had put. Don't make th csvs just remember".

**Response summary:** Honest audit found two FK gaps that would have broken FK enforcement on load — no User record for Jordan T (the membership row's target), and no owner Membership row for Alex G (without it the RLS helper would return false for the owner). Added both. Reshuffled membership IDs so Alex's owner row became `MEMID_AG_0001` (created at org-creation time by a Postgres trigger) and Jordan's editor row became `MEMID_AG_0002`. Restructured all nine entity files from row-per-field to row-per-record layout. Logged the CSV-format preference (one CSV per entity, header + rows) for future use.

**What you did with it:** Accepted.

**Why:** Catching the FK gaps before generating seed data is exactly what this kind of review is for. Row-per-record layout matches the eventual CSV export format and is cleaner for files with multiple records.

---

### Created seed-data folder with JSON files and SQL schema

**Date:** 13/05/2026

**Prompt:** "Make a new folder in this repo and make all the datadictionarys functional so eventually data can be inputted in".

**Response summary:** Created `seed-data/` at the project root with: a README explaining the layout and how to add records, a Postgres `schema.sql` containing draft DDL for all nine entities (with `CHECK` constraints on ID patterns, role enums, JSON types), and nine JSON files — one per entity — each containing the example records in array form. JSON uses CamelCase keys matching the dictionary; SQL uses `snake_case` per Postgres convention. Foreign keys in JSON reference parents by display ID for readability. The schema's footer lists items intentionally left for Weeks 5–6 (RLS policies, audit triggers, indexes, owner-membership trigger).

**What you did with it:** Accepted.

**Why:** JSON-array-per-entity is the lowest-friction "inputtable" format without prematurely committing to a database. The `schema.sql` shows where the data will eventually live without being a working migration yet.

---

### Applied logging convention to CLAUDE.md and migrated existing entries

**Date:** 13/05/2026

**Prompt:** First: "Fill in the necessary ai logs in ai-use-log.md as I want to show how claude helped me". Then: "Apply this to claude.md or to memory so that from future it will generate these honest logs. Update this as you see fit." — followed by a markdown block defining the desired log entry format.

**Response summary:** Reconstructed the session as detailed entries in the prior format. Then applied the user-supplied logging schema as a new `### Log entry format` subsection of the AI Use Policy in `CLAUDE.md`, with two small additions: a note that the trigger is "when the user asks (typically at end of session)" rather than automatic, and a rule that the "What you did with it" verb should be picked honestly. Reformatted all existing entries in this file to the new schema (Date / Prompt / Response summary / What you did with it / Why), reversed the order to chronological (oldest at top, newest at bottom), and added this entry to record the change.

**What you did with it:** Accepted.

**Why:** Centralising the logging convention in `CLAUDE.md` means every future session inherits it without having to re-explain. Chronological order matches how logs are conventionally read (top-to-bottom = past-to-present). Reformatting historical entries kept the log internally consistent — substance preserved, only structure changed.

---

### Added per-entry titles to the log format on ai-use document

**Date:** 13/05/2026

**Prompt:** "Give each log titles though just so the viewer knows the subject of each log".

**Response summary:** Updated the `### Log entry format` subsection in `CLAUDE.md` to require a short title (5–10 words) as a `###` heading at the top of each entry, and added a rule that entries should be separated by a horizontal rule. Added titles to every existing entry in this file and updated the "Entry format" section here to mention the title field.

**What you did with it:** Accepted.

**Why:** Titles make the log scannable at a glance — a reader can read just the headings to get the shape of a session before diving into the bodies. Useful for the Week 10 walk-through, where the teacher will be skimming for high points rather than reading every word.

---

### Reviewed migrations, generated SQL migration and seed handover prompt

**Date:** 01/06/2026

**Prompt:** Multi-turn — "I am using supabase for my database storage and want to merge my data dictionaries in seed-data. Firstly I want to translate my data dictionaries into SQL that I can run to set up the data structure in supabase. Guide me through the process. If the task involves comprehensive code provide a hand-over prompt for claude code." Then: "I do have files in the supabase/migrations folder. Please review if I send prompt to claude code." Then: "In regards to local supabase, all RTV will be done on a production server." Then: "Give me the full prompt."

**Response summary:** Cowork read the existing seed-data/*.json files, seed-data/schema.sql, docs/data-dictionary-examples/*.md, and the two existing migration files. Found that the data dictionaries (JSON and markdown) were already consistent with each other and required no merge — the missing step was converting them into proper Supabase artifacts. Identified a conflict: 20260507141000_profiles.sql creates public.profiles, which conflicts with the schema.sql design of public.users as the auth mirror table. Produced a complete Claude Code handover prompt covering: (1) a new migration file 20260601000000_init_schema.sql that drops profiles, creates all 8 tables from schema.sql, adds the set_updated_at() trigger function, is_active_org_member() RLS helper, handle_new_user() auth trigger, auto-owner-membership trigger, RLS policies on every table, and performance indexes; (2) a supabase/seed.sql file with hardcoded UUIDs and INSERT statements for all 9 entities in FK-safe order. Production-only workflow — no local supabase CLI commands included.

**What you did with it:** Accepted (as a handover prompt — to be sent to Claude Code).

**Why:** The scope (migration + seed + RLS policies + triggers) is too large to safely produce in Cowork without being able to lint or run the SQL. Handing off to Claude Code keeps the production-safety guardrail intact and means any SQL errors can be caught before being run in the Supabase SQL editor. The profiles → users conflict was a genuine blocker that would have caused the migration to fail silently on a live project. I was not able to produce the same quality prompt so I got Claude Cowork to better describe my intentions in order to ensure a better result.

---

### Generated complete Supabase schema migration and seed file

**Date:** 01/06/2026

**Prompt:** Full handover prompt (produced in the previous Cowork session). Instructed Claude Code to: read CLAUDE.md, seed-data/schema.sql, all seed-data/*.json, and docs/data-dictionary-examples/*.md before doing anything; write supabase/migrations/20260601000000_init_schema.sql (drops conflicting profiles artifacts, creates 8 domain tables from schema.sql, adds set_updated_at() trigger, is_active_org_member() RLS helper, handle_new_user() auth trigger, handle_new_organisation() auto-owner trigger, full RLS policies on all 9 tables, and 7 performance indexes); write supabase/seed.sql (hard-coded deterministic UUIDs, FK-ordered INSERTs for all 9 entities from the JSON files, wrapped in BEGIN/COMMIT); run lint and typecheck; add ai-use-log and decision-log entries.

**Response summary:** Produced two new files:

- `supabase/migrations/20260601000000_init_schema.sql` (~360 lines). Sections: (1) drop profiles trigger/function/table; (2) all 8 domain tables with CHECK constraints and FKs; (3) set_updated_at() function + 8 triggers; (4) is_active_org_member() SECURITY DEFINER helper; (5) handle_new_user() SECURITY DEFINER + on_auth_user_created trigger; (6) handle_new_organisation() SECURITY DEFINER + on_organisation_created trigger; (7) RLS enabled + 28 named policies across 9 tables; (8) 7 indexes on hot lookup paths.
- `supabase/seed.sql` (~220 lines). Hard-coded UUIDs with entity-type encoded in the second UUID group (0001=user, 0002=org, etc.). INSERT order respects FK dependencies. auth.users inserts include aud='authenticated' and role='authenticated' (required NOT NULL columns without defaults in Supabase's internal schema). public.users and the owner organisation_members row use DO UPDATE rather than DO NOTHING, because the handle_new_user() and on_organisation_created triggers fire first and insert stub rows with display_id = NULL that need to be overwritten.

Decisions made during generation:

1. `display_id` made NULLABLE in `public.users` and `public.organisation_members`. Both tables have auto-insert triggers that fire before the app can assign a PREFIX_XX_NNNN code (that code encodes the org context, unavailable at auth trigger time). All other tables keep display_id NOT NULL.
2. `is_active_org_member()` uses SECURITY DEFINER + `SET search_path = ''` to break the RLS recursion that would occur if the SELECT policy on organisation_members evaluated itself in a loop.
3. `tag_triggers` has no `organisation_id` column, so its RLS policies use a subquery through `public.tags` to reach the org context. Recursion is prevented because the tags SELECT policy itself calls the SECURITY DEFINER helper.
4. The owner organisation_members INSERT in the seed uses `ON CONFLICT (organisation_id, user_id) DO UPDATE SET id = excluded.id, display_id = excluded.display_id` (not DO NOTHING as the prompt specified) because the trigger inserts the row first with a random UUID and NULL display_id — DO NOTHING would leave those incorrect values in place.

`npm run lint && npm run typecheck` was run. Both fail with pre-existing errors in `src/pages/Dashboard.tsx` (react-hooks/set-state-in-effect) and `src/types/supabase.ts` (parse error). No src/ files were touched in this session; the failures are not caused by this work.

**What you did with it:** Accepted (pending execution in Supabase SQL editor — files not yet run against the database).

**Why:** The migration and seed are ready to be copy-pasted into the Supabase SQL editor. All RLS policies and trigger interactions were reasoned through before writing, including the display_id nullable decision and the DO UPDATE correction for the owner member row.

---

### Generated Claude Code prompt to load all 9 tables and seed data into production Supabase

**Date:** 03/06/2026

**Prompt:** Shared a screenshot of the Supabase Table Editor showing public.profiles already live. Asked to load all 9 data dictionaries into Supabase as tables and add sample seed data so the app has something to display once the React front-end is built. Requested a Claude Code handover prompt.

**Response summary:** Cowork confirmed the screenshot showed public.profiles live from the existing migration. Produced a full Claude Code handover prompt covering: (1) migration file 20260601000000_init_schema.sql that tears down public.profiles cleanly, creates all 9 tables in FK-safe order from seed-data/schema.sql, adds set_updated_at() and is_active_org_member() functions, handle_new_user() and auto_owner_membership() triggers, RLS policies on every table, and performance indexes; (2) supabase/seed.sql with hardcoded UUIDs, INSERT statements for all 9 entities in FK-safe order derived from the seed-data/*.json files, wrapped in BEGIN/COMMIT. Prompt includes step-by-step SQL editor instructions and post-run log update requirements.

**What you did with it:** Accepted (as a handover prompt — to be sent to Claude Code).

**Why:** Same reasoning as the prior session — SQL of this scope is safer to produce and validate in Claude Code where lint and typecheck can run, rather than in Cowork. The screenshot confirmed profiles is genuinely live, making the teardown step in the migration non-negotiable before the schema can be applied.

---

### Revised Supabase schema migration and seed (v2 spec)

**Date:** 03/06/2026

**Prompt:** Full handover prompt (v2) sent to Claude Code. Differences from the 01/06/2026 version: (1) `handle_new_user()` must insert a valid placeholder display_id rather than NULL; (2) auto-owner trigger renamed from `handle_new_organisation()` to `auto_owner_membership()`; (3) organisations INSERT policy changed to `auth.uid() IS NOT NULL` (any authenticated user) rather than `auth.uid() = owner_id`; (4) new UUID pattern for seed.sql (a0000000-... for users, b0000000-... for orgs, etc.). All other requirements (9 tables, full RLS, indexes, FK-ordered seed inserts, no local Supabase CLI) were the same.

**Response summary:** Rewrote both files:

- `supabase/migrations/20260601000000_init_schema.sql` — added two sequences (`user_display_id_seq`, `member_display_id_seq`) so both trigger functions can insert unique, valid placeholder display_ids ('USRID_XX_NNNN', 'MEMID_XX_NNNN') that satisfy the NOT NULL + UNIQUE + CHECK constraints without collision as more users/orgs are created. Renamed trigger function to `auto_owner_membership()`. Updated organisations INSERT policy to `auth.uid() IS NOT NULL`. tag_triggers policies use a subquery through `public.tags` to derive `organisation_id` (the table has no such column directly). All 28 policies, 7 indexes, and 8 updated_at triggers present.
- `supabase/seed.sql` — adopted the new UUID pattern (a/b/c/d/e/f hex-prefix for first six entity types; 07/08 numeric prefix for variables and conversion_events). Organisation_members owner row uses `ON CONFLICT (organisation_id, user_id) DO UPDATE` (not DO NOTHING as the spec suggested) because `auto_owner_membership()` fires during the organisations INSERT and creates the row with a random UUID and placeholder display_id — DO NOTHING would leave those incorrect values permanently. All other rows use DO NOTHING.

`npm run lint && npm run typecheck` shows 4 pre-existing errors in `src/pages/Dashboard.tsx` and `src/types/supabase.ts`. No src/ files were touched; failures pre-date this session.

**What you did with it:** Accepted (pending execution in Supabase SQL editor).

**Why:** The sequence-based placeholder approach is strictly better than a hard-coded literal like 'USRID_XX_0000' because it remains valid under the UNIQUE constraint when multiple users sign up. The DO UPDATE deviation on the owner member row is a correctness fix: the trigger fires first and the seed must be able to overwrite the placeholder row — this is documented and defensible at the walk-through.

---

### Committed and pushed SQL migration and seed to Git

**Date:** 03/06/2026

**Prompt:** "commit and push with necessary titles regarding the SQL I put into Supabase. Update my ai-use-log and documentation doc before this to ensure its up to date."

**Response summary:** Read all four changed files (`supabase/migrations/20260601000000_init_schema.sql`, `supabase/seed.sql`, `docs/ai-use-log.md`, `docs/decision-log.md`) to verify they were consistent with each other and with the v2 spec logged in the prior session. Confirmed the ai-use-log and decision-log were already up to date (covering ADRs 0007–0010 and two 03/06 session entries). Added this entry to close the loop on the SQL being applied to Supabase and committed. Staged all four files and created a commit with a descriptive message, then pushed to `origin/main`.

**What you did with it:** Accepted.

**Why:** The SQL files were already applied to the Supabase SQL editor (user confirmed). Committing them into version control is the correct next step — it means the migration and seed are now part of the folio and can be reviewed at the walk-through alongside the rest of the codebase.

---

### Diagnosed and improved GTM 403 error handling

**Date:** 03/06/2026

**Prompt:** "Fix my website page as it displays a 403 error currently."

**Response summary:** Read `Dashboard.tsx`, `gtm.ts`, `Login.tsx`, and `supabase.ts` to trace the error path. Identified that the 403 was being thrown by the GTM API (Google Tag Manager API v2) and that the error handler in `gtm.ts` was passing the raw JSON response body directly into the thrown error message, making it unreadable. Made two code changes: (1) `gtm.ts` `gtmGet()` now attempts `res.json()` on error responses and extracts `error.message` from Google's error envelope, falling back to the HTTP status string if the body is not JSON; it also attaches `err.status = res.status` so callers can inspect the numeric code; (2) `Dashboard.tsx` was updated to detect `.status === 403` specifically, set a `gtmForbidden` boolean, and render a dedicated error screen with two actionable steps (enable the Tag Manager API in Google Cloud Console; sign out and re-grant the OAuth scope). Explained that the fix cannot resolve the underlying 403 — that requires either enabling the API in GCP or re-authorising with the `tagmanager.readonly` scope.

**What you did with it:** Accepted.

**Why:** The error message improvement is a genuine UX fix — a raw `{"error":{"code":403,...}}` blob in a banner gives the user no actionable path. The 403-specific screen with instructions makes the next step clear without requiring a developer to interpret a JSON object. The root cause (API not enabled or scope not granted) is an external configuration issue, not a code bug.

---

### Built full sidebar-nav dashboard shell with five feature views

**Date:** 03/06/2026

**Prompt:** Detailed spec for a full single-page dashboard shell: fixed left sidebar (220 px) + scrollable content area; five sections (Home, Tags, Triggers, Variables, Conversions); dark-mode Vercel/Linear aesthetic (#0a0a0a background, #6366f1 indigo accent); inline SVG icons; no routing library; no Tailwind; CSS co-located with components; feature-folder structure per CLAUDE.md.

**Response summary:** Created 14 new files and edited 6 existing ones.

New files:
- `src/components/AppShell.tsx / .css` — CSS grid shell (`220px 1fr`), holds `activeView` state, renders `<Sidebar>` and the active view component.
- `src/components/Sidebar.tsx / .css` — logo (hex SVG), five nav buttons (inline SVG icons; 2px indigo left border + rgba tint on active; muted #555 inactive with hover to #e5e5e5), user avatar + name, sign-out button at the bottom.
- `src/features/home/components/HomeView.tsx / .css` — greeting with first name, GTM-connected status badge (green dot when `provider_token` exists), four section cards that navigate on click (Tags is live; Triggers/Variables/Conversions marked "Soon" and disabled).
- `src/features/tags/components/TagsView.tsx / .css` — full GTM tags logic ported from the old Dashboard (account/container selectors, sync button, stat pills with monospace numerals, filter tabs, search input, tags grid); `gtmForbidden` state moved here from Dashboard.
- `src/features/triggers/components/TriggersView.tsx / .css` — placeholder with a ghost table (Name / Type / Tags fired columns) showing five example rows.
- `src/features/variables/components/VariablesView.tsx / .css` — placeholder with a four-column ghost table (Name / Type / Scope / Value).
- `src/features/conversions/components/ConversionsView.tsx / .css` — placeholder with a four-column ghost table (Event name / Display name / Status / Verified).

Edited files:
- `src/pages/Dashboard.tsx` — rewritten to 21 lines: `!provider_token` gate (dark-themed sign-out screen), then renders `<AppShell session={session} />`.
- `src/pages/Dashboard.css` — stripped back to just `.token-gate` styles.
- `src/components/TagCard.css` — rethemed to dark: `#111` background, `#1a1a1a` border, type badge colours changed to alpha-tinted dark backgrounds (e.g. `rgba(37,99,235,0.12)` for google-ads).
- `src/index.css` — body `color` changed from `#111827` to `#e5e5e5`, `background` from `#F8FAFC` to `#0a0a0a`.
- `src/App.css` — app-loading background changed to `#0a0a0a`, spinner border changed to `#6366f1`.

`npx tsc --noEmit` passed with zero errors after all changes.

**What you did with it:** Accepted.

**Why:** The feature-folder split (each view owns its components, hooks, and styles) matches the repo layout in CLAUDE.md and will scale cleanly as Triggers/Variables/Conversions are implemented in later weeks. Moving GTM logic from Dashboard into TagsView is the right separation — Dashboard should not know about GTM. The placeholder views show a skeleton of the real data shape (column names match the data dictionary entities), which makes the folio read as intentional design rather than stub work. The dark palette matches the Linear/Vercel aesthetic specified and is consistent across all layers of the UI.

---

### Diagnosed and resolved Google OAuth setup errors

**Date:** 04/06/2026

**Prompt:** Multi-turn — Pasted the Supabase error `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`. Then shared screenshots of the Supabase Google provider settings page (Client IDs field had "TagOps Pro" typed in it instead of a real Client ID), the Google Cloud Console Credentials page with no project selected, the Credentials page after creating the "TagOps Pro" GCP project, and the OAuth client created dialog showing the Client ID and Client Secret. Then shared an `Error 400: redirect_uri_mismatch` screenshot from Google's sign-in screen.

**Response summary:** Traced the first error to the Supabase Google provider having `"TagOps Pro"` in the Client IDs field instead of a real `*.apps.googleusercontent.com` string. Walked through the full GCP OAuth setup sequence step-by-step: (1) select or create a GCP project (no parent org needed for a school project); (2) configure the OAuth consent screen as External, fill in app name and contact emails; (3) create an OAuth 2.0 Client ID of type Web application with the Supabase callback URL (`https://nkdkfbejsswgllbzjhvd.supabase.co/auth/v1/callback`) in Authorized redirect URIs; (4) copy the real Client ID and Client Secret into Supabase's Google provider settings. After the user successfully created credentials, diagnosed the follow-up `redirect_uri_mismatch` error — caused by the Authorized redirect URIs list in GCP not exactly matching what Supabase sends. Advised adding the Supabase callback URL exactly (no trailing slash) and adding `http://localhost:5173` to both Authorized JavaScript origins and Authorized redirect URIs for local dev, and to wait ~5 minutes for GCP to propagate the change.

**What you did with it:** Accepted.

**Why:** The setup is entirely configuration-level — no code was changed. Understanding each error message and where to fix it (Supabase dashboard vs GCP console) is the key skill here. The redirect_uri_mismatch is one of the most common OAuth gotchas and worth documenting clearly for the walk-through.

---

## Standing notes / guardrails

- AI is a fast junior collaborator, not an authority. Anything it produces about **product direction, target user, scope, or pricing** must be reviewed by me before it enters a public-facing doc.
- AI-suggested **dependencies** must be checked against the existing `package.json` and license/maintenance status before installing.
- AI-generated **tracking-platform code** (GTM API calls, datalayer logic) must be tested against a sandbox container before being run on a real one.
- AI-generated **SQL migrations and RLS policies** must be reviewed manually against the security floor before being applied to a Supabase project. RLS bugs are silent.
- When AI is used to draft user-facing **copy** (marketing site, in-app text, support replies), note it here so tone consistency can be audited later.
- For the Week 10 walk-through: be ready to explain **why** the AI suggested what it did and **why** the chosen modification was the right call, not just **what** changed.
