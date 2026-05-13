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
