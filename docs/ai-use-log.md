# AI Use Log

A running log of substantive AI interactions on TagOps-Pro, kept per the AT3 AI Use Policy.

## Why this log exists (AT3 rules)

1. **Log every substantive Claude Code interaction.** Trivial autocomplete does not need logging; substantive prompts (architecture suggestions, schema design, debugging non-trivial issues, generating components, drafting docs) do.
2. **I must be able to defend every line of submitted code at the Week 10 walk-through.** Code I cannot explain is treated as not my work.
3. **I stay the engineer; AI is the assistant.** Decisions about product direction, scope, and architecture are mine. AI proposes; I dispose.

## Required fields per entry

Each entry must capture:

- **Date.**
- **Tool / model** (e.g., Claude Code with Claude Sonnet 4.6, Claude Opus 4.6 in Cowork mode, etc.).
- **Prompt sent** — the prompt I gave it (verbatim or close paraphrase).
- **Response summary** — what it produced, in one or two sentences.
- **Outcome** — Accepted as-is / Modified / Rejected.
- **Reasoning** — why I made that call.
- **Where it landed** — file paths, commits, or PRs.

Add new entries to the top. Do not edit historical entries.

---

## 2026-05-13 — Drafted starter folio docs and `CLAUDE.md`

- **Tool / model:** Claude Opus 4.x in Cowork mode.
- **Prompt sent:** "Look in the docs folder", then "yes draft starters" (problem statement, decision log, AI use log) and "what needs to be done to configure Claude for this development project". Later: shared the Noetica Teach orientation PDF and asked to update as necessary.
- **Response summary:** Read the existing `02-requirements.md`, then drafted `docs/01-problem-statement.md`, `docs/decision-log.md`, and an initial version of this file. Drafted a `CLAUDE.md` at the repo root. After receiving the AT3 orientation PDF, rewrote `CLAUDE.md` to reflect the mandated stack, the security floor, the AI-use policy, the nine-week timeline, the required repository shape, and the marking structure. Updated `01-problem-statement.md` to add an academic-context note and reworked this `ai-use-log.md` to match the AT3 logging format.
- **Outcome:** Modified.
- **Reasoning:** The first draft of `CLAUDE.md` was based on guesses about the stack; the orientation PDF made the stack mandated and added the security floor, AI policy, and timeline as non-negotiable. The draft folio docs were broadly accepted but required the academic context call-out and the logging-format change so they fit the AT3 conventions.
- **Where it landed:**
  - `CLAUDE.md` (created, then rewritten)
  - `docs/01-problem-statement.md` (created, then amended)
  - `docs/decision-log.md` (created — naming kept as-is rather than the AT3 spec `decisions.md`, pending teacher confirmation)
  - `docs/ai-use-log.md` (this file — created, then reformatted to AT3 spec)
  - `README.md` (created — top-level project overview)

---

## Standing notes / guardrails

- AI is a fast junior collaborator, not an authority. Anything it produces about **product direction, target user, scope, or pricing** must be reviewed by me before it enters a public-facing doc.
- AI-suggested **dependencies** must be checked against the existing `package.json` and license/maintenance status before installing.
- AI-generated **tracking-platform code** (GTM API calls, datalayer logic) must be tested against a sandbox container before being run on a real one.
- AI-generated **SQL migrations and RLS policies** must be reviewed manually against the security floor before being applied to a Supabase project. RLS bugs are silent.
- When AI is used to draft user-facing **copy** (marketing site, in-app text, support replies), note it here so tone consistency can be audited later.
- For the Week 10 walk-through: be ready to explain **why** the AI suggested what it did and **why** the chosen modification was the right call, not just **what** changed.
