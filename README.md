# TagOps-Pro

A tracking organisation and operational tool for business owners — a single source of truth for the Tags, Triggers, Conversion events, and Variables that power their analytics and marketing setup (Google Tag Manager, GA4, and similar). The MVP focuses on organising the setup, inviting teammates with expiry dates, and surfacing suggestions when something is missing. The roadmap adds AI-assisted suggestions, automated firing verification, and two-way sync with Google's platforms.

This repository is also my **Year 12 Software Engineering AT3 project** for Noetica Academy, Term 2 2026. The product is genuine; it is also subject to the AT3 brief's mandated stack, security floor, AI-use policy, and nine-week timeline.

---

## Stack

- **Hosting / deployment:** Vercel (continuous deployment).
- **Backend:** Supabase (Postgres, Auth, Row-Level Security, Storage, Edge Functions).
- **Frontend:** React + TypeScript on Vite.
- **AI development assistant:** Claude Code.
- **Editor:** VS Code.

Frontend framework choice (React + TS + Vite) is justified in the decision log; the rest of the stack is mandated by the AT3 brief.

---

## Project folio

The `/docs` folder is the running record of this project. Read these in order:

- [`docs/01-problem-statement.md`](docs/01-problem-statement.md) — the need, the users, and what "solved" looks like.
- [`docs/02-requirements.md`](docs/02-requirements.md) — MUST-HAVE / MVP and WOULD-BE-NICE features.
- [`docs/03-architecture.md`](docs/03-architecture.md) — high-level design, request lifecycle, diagrams. _(Weeks 3–4)_
- [`docs/04-data-model.md`](docs/04-data-model.md) — schema, ERD, relationships. _(Weeks 5–6)_
- [`docs/05-security-review.md`](docs/05-security-review.md) — threat model, RLS reasoning, defensive patterns. _(Weeks 6–7)_
- [`docs/06-front-end-architecture.md`](docs/06-front-end-architecture.md) — component tree, CSS approach, accessibility. _(Weeks 6–7)_
- [`docs/07-evaluation.md`](docs/07-evaluation.md) — the evaluation report itself. _(Week 9)_
- [`docs/08-test-plan.md`](docs/08-test-plan.md) — test layers, coverage decisions. _(Week 8)_
- [`docs/09-iteration-log.md`](docs/09-iteration-log.md) — UAT feedback, deployment iteration. _(Week 8)_

Two running logs accumulate across the whole term:

- [`docs/decision-log.md`](docs/decision-log.md) — every significant technical or product choice, with reasoning. _(The AT3 spec names this `decisions.md`; the filename here is kept as `decision-log.md` pending teacher confirmation.)_
- [`docs/ai-use-log.md`](docs/ai-use-log.md) — every substantive Claude Code interaction: prompt, response summary, outcome, reasoning.

The numbered files `03`–`09` are created when their week arrives, not pre-populated as placeholders.

For agent / AI tooling guidance, see [`CLAUDE.md`](CLAUDE.md) at the repo root.

---

## Repository layout

```
TagOps-Pro/
├── README.md
├── CLAUDE.md                  guidance for AI assistants
├── docs/                      the folio
├── src/                       application source
├── supabase/
│   ├── migrations/            numbered SQL migrations
│   └── functions/             edge functions if any
└── tests/
    ├── unit/                  unit tests on pure logic
    ├── integration/           policy tests against local Supabase
    └── smoke/                 end-to-end smoke tests on critical flows
```

---

## Dev setup

- `npm install` — install dependencies.
- `npm run dev` — start the Vite dev server.
- `npm run build` — typecheck + production build.
- `npm run lint` — ESLint.
- `npm run typecheck` — TypeScript project build (`tsc -b`).
- `npm run test` — Vitest unit suite (`tests/unit/`).
- `npm run test:watch` — Vitest in watch mode.
- `supabase start` — local Supabase for integration tests.

Environment variables live in `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); never commit a real env file.

### Desktop app (extra, not part of the AT3 deliverable)

An Electron shell in `desktop/` wraps the same built frontend as a standalone macOS app (see ADR-0021):

- `npm run desktop` — build the web app and launch the desktop shell.
- `npm run desktop:package` — build and package `desktop/out/mac-arm64/TagOps Pro.app`.

One-time setup: add `http://127.0.0.1:53682/auth/callback` to **Supabase → Authentication → URL Configuration → Redirect URLs**. Desktop sign-in opens Google in your normal browser and returns the session to the app (Google blocks OAuth inside embedded app windows).

---

## Security floor

This project meets six minimum security requirements (per the AT3 brief): Supabase Auth, at least one RLS policy, no service-role keys in client code, email verification on signup, input validation client-and-database-side, and no plaintext storage of sensitive data. Stronger measures (rate limiting, CSRF, secure headers, dependency auditing, deliberate threat modelling) are documented in `docs/05-security-review.md`.

---

## Deliverables (Week 11)

1. Working solution deployed at a Vercel URL.
2. Short report (1,000–1,300 words, PDF) covering engineering decisions, tool/resource choices, and secure data handling.
3. This `/docs` folio.
4. Git invitation to the marking teacher.

Plus a 15-minute walk-through in Week 10.

---

## Status

In Week 2 (kick-off). Problem statement and requirements drafted; architecture, data model, and migrations not yet started.
