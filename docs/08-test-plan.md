# 08 - Test Plan

## Test layers

| Layer | Purpose | Run with | Status |
|---|---|---|---|
| `tests/unit/` | Pure logic, no live Supabase/GTM needed | `npm run test` (Vitest) | **Implemented** — 1 file, 29 tests, all passing |
| `tests/integration/` | Policy tests against a local Supabase instance (RLS behaviour) | `supabase start` + a test runner against it | **Not yet implemented** — directory doesn't exist yet |
| `tests/smoke/` | End-to-end critical flows in a real browser | Playwright | **Not yet implemented** — Playwright isn't installed; named in `CLAUDE.md`'s mandated stack but not yet added |

## Current unit coverage

One file, chosen specifically because `CLAUDE.md` requires unit tests for anything that reads or pushes to `window.dataLayer`:

- **`tests/unit/simulator.test.ts`** (29 test cases) — covers `src/features/preview/lib/simulator.ts`, the logic behind the Preview page's dataLayer/tag-firing simulation. Tests the resolution of built-in GTM variables, trigger matching logic, and the deliberate "unresolved, with a reason" behaviour for variables that would require a real loaded page (Page URL/Hostname/Path, Referrer) — the simulator is designed to never fabricate those from TagOps-Pro's own URL, and that boundary is directly tested.

Runs with zero external dependencies (no network, no database), which is why it was the first layer built.

> **Note (28/08/2026):** `tests/unit/snippets.test.ts` (7 test cases, covering the conversion-event tracking-code generator, including two adversarial injection tests added 27/08/2026 after a real vulnerability was found — see `05-security-review.md`) was removed along with the feature it tested (ADR-0038, `decision-log.md`). It was a real, working example of a regression test added specifically because something had already gone wrong once — worth the same discipline on whatever's built next.

## RLS / security testing strategy

This is the most significant gap, named directly rather than glossed over: the two real RLS bugs fixed on 27/08/2026 (`containers` and `organisation_members` INSERT policies both had a self-referential `WHERE organisation_id = organisation_id` clause that made the check a no-op) were found by manual code review during an audit — nothing automated in this repository would have caught either one, and nothing still does.

A concrete test for this class of bug is straightforward to describe even though it isn't built yet: with `supabase start` running a local instance, impersonate two different authenticated users belonging to two different organisations (via `set_config('request.jwt.claims', ...)` inside a test transaction, matching the technique already used for manual debugging in ADR-0025), then assert that User A's attempt to `INSERT` a row with User B's `organisation_id` is rejected by the policy rather than silently succeeding. Written once per table with an `organisation_id`-scoped policy, this would have caught both real bugs directly instead of relying on a human to re-read every policy by eye. This is deliberately deferred rather than built in this pass — recorded here so it's a known, prioritised gap rather than a silent one.

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

Stated plainly rather than implied: there is no integration test suite exercising RLS policies directly, no Playwright smoke suite despite it being named in the mandated stack, and no component-level tests for individual React components (coverage today is limited to two pure-logic modules). This is an acceptable state for the current stage of the project given the timeline, but it is a real gap, not a deliberately-scoped exclusion — closing the RLS integration-test gap specifically is the highest-priority item in `07-evaluation.md`'s future-improvements list, precisely because it's the one category of bug that has already happened twice.
