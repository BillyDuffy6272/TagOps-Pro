# CLAUDE.md

Project-level guidance for Claude (Claude Code, Cowork, Cursor, or any other Claude-powered assistant). Read this first on every session.

---

## What this project is

**TagOps-Pro** is a tracking organisation and operational tool for business owners. It lets non-technical owners centrally manage Tags, Triggers, Conversion events, and Variables (the same primitives used in Google Tag Manager and GA4), invite teammates with expiry dates, and — on the roadmap — get AI suggestions and automated firing verification.

The authoritative product docs live in `/docs`:

- `docs/01-problem-statement.md` — the need, the opportunity, the scope.
- `docs/02-requirements.md` — functional and non-functional requirements.
- `docs/03-architecture.md` — high-level design, request lifecycle, diagrams. _(Weeks 3–4)_
- `docs/04-data-model.md` — schema, ERD, relationships. _(Weeks 5–6)_
- `docs/05-security-review.md` — threat model, RLS reasoning, defensive patterns. _(Weeks 6–7)_
- `docs/06-front-end-architecture.md` — component tree, CSS approach, accessibility. _(Weeks 6–7)_
- `docs/07-evaluation.md` — the evaluation report itself. _(Week 9)_
- `docs/08-test-plan.md` — test layers, coverage decisions. _(Week 8)_
- `docs/09-iteration-log.md` — UAT feedback, deployment iteration. _(Week 8)_
- `docs/decision-log.md` — running decisions and trade-offs log. _(starts Week 2; the AT3 orientation calls this `decisions.md` — confirm with teacher whether to align the filename or keep as-is)_
- `docs/ai-use-log.md` — substantive Claude Code interactions. _(starts Week 2)_

**Always read `docs/01-problem-statement.md` and `docs/02-requirements.md` before suggesting features or architecture.**

---

## Academic context (this is the AT3 project)

TagOps-Pro is being built as my Year 12 Software Engineering AT3 project at Noetica Academy. The product vision is genuine, but the project is also subject to school constraints:

- **9-week build window**, Weeks 3–11 of Term 2, with kick-off in Week 2. A working v1 ships by Week 9.
- **Week 10 walk-through:** a 15-minute conversation with the teacher, defending the deployed solution and folio entries.
- **Week 11 submission:** working solution at a Vercel URL, 1,000–1,300-word report (PDF, three sections: engineering decisions, tool/resource choices, secure data handling), the `/docs` folio, and a Git invitation to the teacher.
- The project is **30% of the overall course mark** and integrates Secure Software Architecture, Programming for the Web, and the Software Engineering Project module.
- **Marking happens in two passes.** Part A (the solution) is marked on structural code, safety/security features, and performance refinement. Part B (the report) is marked on the strength of justifications, the evaluation of secure data handling, and clarity of communication.
- **Canvas is the legal record** for the assessment notification. If anything in the docs or in this file conflicts with Canvas, Canvas wins.

When Claude is helping, it should keep these constraints in view: the timeline is fixed, the stack is fixed (see below), and the student must be able to **defend every line of code** at the walk-through.

---

## The stack (mandated)

The infrastructure stack is mandated by the AT3 brief. Off-stack deviations require explicit teacher approval before end of Week 3.

- **Hosting / deployment:** **Vercel** (continuous deployment from the Git repo).
- **Backend:** **Supabase** — Postgres database, Auth, Row-Level Security, Storage, Edge Functions. One integrated service, no separate backend server.
- **AI development assistant:** **Claude Code** (this is the tool whose use must be logged per the AI Use Policy below).
- **Editor:** **VS Code**.

Within the mandated infrastructure, the following choices are mine to make and justify in Section 2 of the report:

- **Front-end framework:** **React + TypeScript** (with **Vite**, including Rolldown). The StudyShare worked example uses React, and the existing `node_modules` reflects this choice.
- **Linting:** ESLint with `@typescript-eslint`.
- **Styling:** **Tailwind CSS**. _(open — confirm in an ADR before first feature)_
- **Data fetching / server state:** **TanStack Query** against the Supabase client. _(open — confirm in an ADR)_
- **Client state:** **Zustand** for small global stores; React state for local. _(open)_
- **Routing:** TBD — propose React Router or TanStack Router in an ADR before adding.
- **Testing framework:** **Vitest** for unit/integration; **Playwright** for smoke. _(open — confirm in an ADR)_
- **Tracking-platform integrations:** Google Tag Manager API and GA4 Data/Admin APIs (read-only in MVP, see Tracking-platform safety rules below).

When suggesting a new library, check `package.json` first and prefer libraries already present.

---

## Repository layout (required shape)

The directory layout below is the shape every submitted repository must match. Source under `/src`, migrations under `/supabase/migrations/`, tests under `/tests/`, folio under `/docs/`. The numbered folio files are a convention but the top-level shape is rigid — a marker should be able to find source, migrations, tests, and folio without hunting.

```
TagOps-Pro/
├── README.md                       project overview, links to the docs
├── CLAUDE.md                       this file
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env.example                    documented template — never commit .env
├── .gitignore                      must include .env, node_modules, dist
├── docs/                           the folio
│   ├── 01-problem-statement.md
│   ├── 02-requirements.md
│   ├── 03-architecture.md
│   ├── 04-data-model.md
│   ├── 05-security-review.md
│   ├── 06-front-end-architecture.md
│   ├── 07-evaluation.md
│   ├── 08-test-plan.md
│   ├── 09-iteration-log.md
│   ├── decision-log.md             running decisions log (AT3 spec calls this decisions.md)
│   └── ai-use-log.md               substantive Claude Code interactions
├── src/                            application source
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   ├── features/                   feature-scoped folders (tags/, triggers/, account/, team/)
│   │   └── <feature>/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/                Supabase / TanStack Query calls for this feature
│   │       └── types.ts
│   ├── components/                 cross-feature, presentational UI
│   ├── lib/                        supabase client, query client, helpers
│   ├── styles/
│   └── types/
├── supabase/
│   ├── migrations/                 numbered SQL migrations
│   └── functions/                  edge functions (if any)
└── tests/
    ├── unit/                       unit tests on pure logic
    ├── integration/                policy tests against local Supabase
    └── smoke/                      end-to-end smoke tests on critical flows
```

Folio files are started as the relevant week arrives — do **not** pre-create empty placeholders for `03`–`09`. The two running logs (`decisions.md`, `ai-use-log.md`) start in Week 2 and accumulate across the term.

Prefer **feature folders** over technical-layer folders. A `tags` feature owns its components, hooks, and Supabase queries.

---

## Dev commands

(Confirm/update these once `package.json` is restored.)

- `npm run dev` — start the Vite dev server.
- `npm run build` — production build.
- `npm run preview` — preview the production build locally.
- `npm run lint` — run ESLint.
- `npm run typecheck` — run `tsc --noEmit`.
- `npm run test` — run Vitest unit + integration suites.
- `npm run test:smoke` — run the Playwright smoke suite.
- `supabase start` / `supabase db reset` — local Supabase for integration tests.

**Before claiming a task is "done", Claude should run (or ask the user to run) `npm run lint`, `npm run typecheck`, and the relevant test suite.**

---

## Security floor (hard requirements)

These six requirements are the **minimum** security posture of any submission. Falling short on any one is a failure of the security floor; meeting all six is the floor, not the ceiling. Stronger submissions add rate limiting, CSRF tokens, secure headers, audited dependencies, and deliberate threat modelling, documented in `docs/05-security-review.md`.

1. **Authentication via Supabase Auth** (email-and-password, OAuth, or both). Required for per-user data access to mean anything.
2. **At least one Row-Level Security policy** protects user data at the database level. RLS is the database itself enforcing visibility — a compromised client cannot leak data the user is not entitled to see.
3. **No service-role keys in client-side code.** The service role bypasses RLS. If it appears in the client bundle, anyone reading the bundle has full database access.
4. **Email verification enabled on signup.** Otherwise a malicious user can register accounts in someone else's name.
5. **Input validation on every form field**, at submission time on the client **and** at the database via RLS conditions, `CHECK` constraints, or column types. Client-side validation alone is window dressing.
6. **No plaintext storage of sensitive data.** Passwords go through Supabase Auth and are never stored directly. Treat any data that would be embarrassing or harmful if leaked with the same caution.

Claude must not propose patterns that violate the floor (e.g., suggesting service-role keys be used from the client, or skipping RLS "to make development faster"). If a tutorial or library example does so, flag it as unsafe and propose an alternative.

---

## AI Use Policy

AI use is **expected**, not just permitted. Three rules govern how it is used and recorded:

1. **Log every substantive Claude Code interaction in `docs/ai-use-log.md`** — the prompt sent, a summary of the response, what was done with it (accepted, modified, rejected), and the reasoning. Trivial autocomplete does not need logging; substantive prompts (architecture suggestions, schema design, debugging non-trivial issues, generating components) do.
2. **Be able to defend every line of submitted code at the walk-through.** Code that cannot be explained is treated as not the student's work.
3. **Stay the engineer; AI is the assistant.** Decisions about product direction, scope, and architecture are mine. Claude proposes; I dispose.

Claude should **proactively suggest a new `ai-use-log.md` entry** whenever it has just produced something non-trivial (a new file, a refactor across multiple files, drafted user-facing copy, a meaningful architectural recommendation, or a debugging session that turned up a non-obvious cause).

---

## Coding conventions

- **TypeScript:** strict mode on. Avoid `any`; prefer `unknown` + narrowing. No `// @ts-ignore` without a comment explaining why.
- **React:** function components only; hooks for state and effects. No class components.
- **Naming:** `PascalCase` for components and types, `camelCase` for variables and functions, `kebab-case` for file names except component files (which are `PascalCase.tsx`).
- **Imports:** absolute imports via `@/` alias for anything in `src/`. Group as: node built-ins → third-party → `@/` internal → relative.
- **Styling:** Tailwind utility classes inline. Extract a component when a class string repeats more than twice or grows past ~6 utilities.
- **Server state:** use TanStack Query hooks (`useQuery`, `useMutation`) for any Supabase call. Never call Supabase directly from a component.
- **Errors:** never swallow them silently. Surface to the UI via a toast/banner and log to the console in dev.
- **Comments:** explain _why_, not _what_. The code shows what; the comment shows the reasoning a reader can't recover.
- **Supabase migrations:** numbered SQL files in `supabase/migrations/`. Never edit an applied migration — add a new one.

---

## Tracking-platform safety rules

TagOps-Pro touches real production tracking. Mistakes here cost real money for the business owner.

- **Never write to a production GTM container or GA4 property** without explicit user confirmation in the same turn. Read-only by default.
- **All write operations must be tested against a sandbox GTM container first.** A test fixture container ID lives in `.env.local`, not in code.
- **Datalayer code** (anything that reads or pushes to `window.dataLayer`) must have unit tests.
- **Treat OAuth tokens and API keys as secrets.** Never log them, never paste them into chat, never commit them. Use `.env` with `.env.example` as a documented template.

---

## The nine-week timeline

The course IUs scaffold the project week-by-week. Use this as the navigation rather than a separate concern.

- **Week 2 — Kick-off (IU12SE-012).** Problem and scope defined. Stack set up: Git repo initialised, Vercel CD configured, Supabase project provisioned. Folio started — `01-problem-statement.md`, `02-requirements.md`, `decision-log.md`, `ai-use-log.md`.
- **Weeks 3–4 — Web infrastructure + architecture (IU12SE-013, IU12SE-014).** Requirements with acceptance criteria. `03-architecture.md` with high-level diagrams.
- **Weeks 5–6 — Data layer (IU12SE-015).** Heaviest single block. `04-data-model.md` (schema + ERD), Supabase migrations, RLS policies.
- **Weeks 6–7 — User-facing layer + security hardening (IU12SE-016, IU12SE-017).** `06-front-end-architecture.md`, `05-security-review.md` with threat modelling.
- **Week 8 — Testing, version control, deployment (IU12SE-018, IU12SE-019).** Unit + integration + smoke tests. `08-test-plan.md`, `09-iteration-log.md`.
- **Week 9 — Evaluation + walk-through prep (IU12SE-020).** `07-evaluation.md` drafted. v1 shipped.
- **Week 10 — Submission + walk-through.** 15 minutes with teacher.
- **Week 11 — Final due date** for the four deliverables.

---

## What to do / what not to do

**Always:**
- Read `/docs` files relevant to the task before proposing changes.
- Suggest an entry in `docs/decision-log.md` for any significant choice (new library, new architectural pattern, change of provider).
- Suggest an entry in `docs/ai-use-log.md` for any substantive output (new file, refactor, drafted copy, architectural recommendation, non-trivial debug).
- Default to RLS-first thinking — design the policy before the query.
- Prefer editing existing files over creating new ones.
- Ask before installing a new dependency.

**Never:**
- Commit secrets, tokens, OAuth credentials, or real customer data.
- Propose patterns that violate the Security Floor (e.g., service-role key in client, skipping RLS).
- Make changes to product direction, target user, scope, or pricing without flagging them as a proposal.
- Deviate from the mandated stack (Vercel, Supabase, Claude Code, VS Code) — that needs teacher approval before end of Week 3.
- Run destructive shell commands (`rm -rf`, `git push --force`, destructive migrations) without confirmation.

---

## Solo-developer context

This project is being built by a solo Year 12 developer working AI-assisted. That means:

- Bias toward **readable, conventional code** over clever code — future-me, and the marking teacher at the walk-through, will read it without context.
- Bias toward **boring, well-documented libraries** over shiny new ones.
- When in doubt, **ask one clarifying question** rather than make three assumptions.
- Every non-trivial decision is a candidate for a `decision-log.md` entry and a `07-evaluation.md` reflection later.

---

_Last updated: 2026-05-13. Update this file whenever the stack, conventions, security floor, or AI-use rules change._
