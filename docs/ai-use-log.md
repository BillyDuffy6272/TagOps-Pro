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

## Standing notes / guardrails

- AI is a fast junior collaborator, not an authority. Anything it produces about **product direction, target user, scope, or pricing** must be reviewed by me before it enters a public-facing doc.
- AI-suggested **dependencies** must be checked against the existing `package.json` and license/maintenance status before installing.
- AI-generated **tracking-platform code** (GTM API calls, datalayer logic) must be tested against a sandbox container before being run on a real one.
- AI-generated **SQL migrations and RLS policies** must be reviewed manually against the security floor before being applied to a Supabase project. RLS bugs are silent.
- When AI is used to draft user-facing **copy** (marketing site, in-app text, support replies), note it here so tone consistency can be audited later.
- For the Week 10 walk-through: be ready to explain **why** the AI suggested what it did and **why** the chosen modification was the right call, not just **what** changed.
