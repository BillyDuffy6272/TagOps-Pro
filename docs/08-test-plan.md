# 08 - Test Plan

> **Status: template, not yet written.** Slotted for Week 8 (IU12SE-018/019). Covers the three test layers in `tests/` (`unit/`, `integration/`, `smoke/`), what's actually covered today, and what coverage decisions were made deliberately versus left as gaps. Replace each italic prompt with your own writing.

---

## Test layers

*Explain what each layer in `tests/` is for and how to run it:*

| Layer | Purpose | Run with | Status |
|---|---|---|---|
| `tests/unit/` | Pure logic, no live Supabase/GTM needed | `npm run test` | |
| `tests/integration/` | Policy tests against local Supabase (RLS behaviour) | `supabase start` + … | |
| `tests/smoke/` | End-to-end critical flows (Playwright) | | |

## Current unit coverage

*What's actually tested and why those were chosen. Currently: `tests/unit/simulator.test.ts` (the Preview/dataLayer simulation logic) and `tests/unit/snippets.test.ts` (the copy-paste tracking-code generator, including adversarial quote-injection and newline-injection cases added 2026-08-27 after a real snippet-injection bug was found and fixed — see `decision-log.md` ADR-0029). Note why these two files specifically got unit tests ahead of everything else: `CLAUDE.md` requires datalayer-touching code to have unit tests, and both generate/interpret data that reaches a real website.*

## RLS / security testing strategy

*This is the more interesting gap to address head-on: the two RLS bugs fixed on 2026-08-27 (`containers` and `organisation_members` INSERT policies) were found by manual code review, not by any test — nothing in the repo would have caught a self-referential `WHERE organisation_id = organisation_id` clause automatically. What would an integration test for this actually look like? (Sketch: using `supabase start` locally, impersonate two different users in two different organisations via `set_config('request.jwt.claims', …)`, and assert that user A's insert attempt into user B's org is rejected.) Decide whether this is being built now or deliberately deferred, and say which.*

## Manual testing / walkthrough checklist

*A plain checklist of the flows you manually click through before considering a change "done" — sign in, create/join an organisation, view each of Tags/Triggers/Variables/Conversions/Preview, add/remove a team member, toggle light/dark theme, etc. This is what actually backs up "tested" when there's no automated coverage for a given flow yet.*

## Known gaps

*State plainly what isn't tested yet and why it's an acceptable gap for now versus a real risk: no integration tests against local Supabase, no Playwright smoke suite despite being in the mandated stack, most UI components have no component-level tests. Tie each gap back to a priority/timeline reason, not just "didn't get to it."*
