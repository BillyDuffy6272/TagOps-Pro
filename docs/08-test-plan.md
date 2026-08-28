# 08 - Test Plan

## Test layers

| Layer | Purpose | Run with | Status |
|---|---|---|---|
| `tests/unit/` | Pure logic, no live Supabase/GTM needed | `npm run test` (Vitest) | **Implemented and verified** — 1 file, 29 tests, all passing |
| `tests/integration/` | Policy tests against a local Supabase instance (RLS behaviour) | `supabase start`, then `npm run test:integration` | **Implemented, not yet verified** — written 28/08/2026 (ADR-0040), but never actually run — no Docker in the environment that wrote it, and `supabase start` needs Docker for the local Postgres/Auth stack. Type-checks cleanly; run it locally before trusting it |
| `tests/smoke/` | End-to-end critical flows in a real browser | `npm run test:smoke` (Playwright) | **Implemented and verified for what it covers** — 3 tests, all passing, but scoped to the signed-out Landing/Login flow only (see below for why) |

## Current unit coverage

One file, chosen specifically because `CLAUDE.md` requires unit tests for anything that reads or pushes to `window.dataLayer`:

- **`tests/unit/simulator.test.ts`** (29 test cases) — covers `src/features/preview/lib/simulator.ts`, the logic behind the Preview page's dataLayer/tag-firing simulation. Tests the resolution of built-in GTM variables, trigger matching logic, and the deliberate "unresolved, with a reason" behaviour for variables that would require a real loaded page (Page URL/Hostname/Path, Referrer) — the simulator is designed to never fabricate those from TagOps-Pro's own URL, and that boundary is directly tested.

Runs with zero external dependencies (no network, no database), which is why it was the first layer built.

> **Note (28/08/2026):** `tests/unit/snippets.test.ts` (7 test cases, covering the conversion-event tracking-code generator, including two adversarial injection tests added 27/08/2026 after a real vulnerability was found — see `05-security-review.md`) was removed along with the feature it tested (ADR-0038, `decision-log.md`). It was a real, working example of a regression test added specifically because something had already gone wrong once — worth the same discipline on whatever's built next.

## RLS / security testing strategy

The two real RLS bugs fixed on 27/08/2026 (`containers` and `organisation_members` INSERT policies both had a self-referential `WHERE organisation_id = organisation_id` clause that made the check a no-op) were found by manual code review during an audit — nothing automated in this repository caught either one at the time.

**`tests/integration/rls.test.ts`** (added 28/08/2026, ADR-0040) is a direct answer to that gap: it impersonates two different authenticated users belonging to two different organisations — via `set_config('request.jwt.claims', ...)` plus `SET LOCAL ROLE authenticated` inside a transaction that always rolls back, the same mechanism PostgREST itself uses per request, matching the technique already used for manual debugging in ADR-0025 — then asserts that a cross-organisation write is rejected. Seven tests, each tied to a real, documented threat rather than generic coverage:

- Cross-org `tags` INSERT rejected, same-org INSERT succeeds (positive control)
- Cross-org `tags` SELECT returns zero rows rather than erroring, same-org SELECT returns the row (positive control)
- Cross-org `organisation_members` INSERT rejected — the exact ADR-0029/ADR-0033 cross-tenant takeover bug, attempting the worst case directly (inserting an `'owner'` row into someone else's org)
- `organisation_members` UPDATE cannot set `role = 'owner'`, even for an admin who can otherwise update that row
- An expired membership (`expires_at` in the past) is treated as inactive, blocking a write that an active membership in the same role would allow

**Important limitation, stated plainly:** this suite was written but has never actually been run. `supabase start` needs Docker for the local Postgres/Auth stack, and the environment these tests were written in doesn't have Docker available. The SQL was written directly against the real schema and policy text in `supabase/migrations/`, and the file type-checks cleanly, but that is not the same as having executed it against a real database and watched it pass. **Run `supabase start` then `npm run test:integration` locally before trusting these tests** — if any fail, the bug could be in the test's SQL/fixtures rather than the policy under test, since neither has been proven against a real instance yet.

## Smoke test coverage

**`tests/smoke/landing-login.spec.ts`** (added 28/08/2026, ADR-0040) — 3 Playwright tests, run against a real production build (`npm run build` + `vite preview`, not the dev server) and actually executed and passing, not just written: Landing renders and its "Get started" button leads into the real Login screen; Login's logo returns to Landing; and no console errors occur across that flow.

**Deliberately scoped to the signed-out flow only.** Every other view (Tags, Settings, Organisation, etc.) requires a real, Google-authenticated Supabase session, and there's no way to fake one safely here: a hand-crafted JWT would satisfy the client's own "am I logged in" check, but would fail signature validation on every real Supabase query, so it wouldn't actually prove those views work — it would just prove the login gate can be bypassed, which isn't the same thing and isn't a test worth having. Automating the authenticated flows would need a stored, real, valid session (Playwright's `storageState`, captured from an actual sign-in) — not attempted here. Manual click-through remains how the authenticated app is verified, per the checklist below.

## Manual testing / walkthrough checklist

What actually gets clicked through before a change is considered done, in the absence of the automated coverage above:

- Sign in with Google from a signed-out state
- A brand-new account: land on `OrganisationOnboarding`, create an organisation, confirm it appears correctly
- Join an existing organisation via an invite code
- Every primary view loads without error: Home, Tags, Triggers, Variables, Preview, Settings, Organisation
- Add a team member, set an expiry date, confirm it's editable and removable; confirm the owner row is not editable
- Toggle Light / Dark / System theme and confirm it persists across a reload
- Disconnect/reconnect the Google account and confirm `GtmForbiddenState` renders correctly on a 403 rather than a generic error

## Known gaps

Stated plainly rather than implied: the RLS integration suite has not been run against a real database yet (see above — needs `supabase start` locally), the smoke suite covers only the signed-out flow, and there are no component-level tests for individual React components (unit coverage today is one pure-logic module). This is an improvement on the previous state, not a closed gap — running the integration suite for the first time, and deciding whether authenticated smoke coverage is worth the `storageState` setup, are both still open.
