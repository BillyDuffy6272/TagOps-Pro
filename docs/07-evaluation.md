# 07 - Evaluation

> **Status: template, not yet written.** Slotted for Week 9 (IU12SE-020) — drafted ahead of the Week 10 walk-through. This is the evaluation report itself: how well the solution meets what it set out to do, judged honestly rather than just listing features built. Replace each italic prompt with your own writing.

---

## Requirements traceability

*Go through every MUST HAVE item in `02-requirements.md` and mark it Met / Partially met / Not met, with a one-line note. Do the same for the WOULD BE NICE list — several of those already shipped (e.g. theme switching, per-entity detail views, the Home page "what each page shows" tutorial section) even though they weren't required; say so, it's a legitimate point in your favour. A table works well here:*

| Requirement | Status | Notes |
|---|---|---|
| | | |

## What went well

*Pick 2–4 genuine strengths, each backed by something concrete — not "the UI looks nice" but e.g. "RLS is enforced on every domain table with no blanket-permissive policy, confirmed by a full-repo audit on 2026-08-27." Evidence beats adjectives here.*

## What was challenging / what changed from the plan

*Where did the build diverge from the original architecture or timeline, and why? Good candidates already on record in `decision-log.md`: the `RETURNING`-vs-RLS bug that blocked organisation creation (ADR-0025), the ambiguous foreign-key embed issue (ADR-0026), the silently-swallowed-error bug that hid real failures for a while (ADR-0024). Pick the ones that taught you something, not just the ones that took time.*

## Security floor self-assessment

*Cross-reference `05-security-review.md` rather than repeating it — one paragraph summarising where the floor stands, and naming the two RLS bugs found and fixed on 2026-08-27 as a case study in why the floor is a process (review, find, fix), not a one-time checkbox.*

## Accessibility self-assessment

*Cross-reference `06-front-end-architecture.md`. Be honest about the gap between "implemented" and "complete" — e.g. modal dialog semantics and some color-contrast tokens were identified as issues and deliberately left unfixed for this iteration. Explaining *why* you made that call (time, priority, a considered trade-off) is worth more marks than pretending it isn't there.*

## Testing summary

*Cross-reference `08-test-plan.md` — what's actually covered (unit tests: `simulator.test.ts`, `snippets.test.ts`, including the adversarial injection-attempt tests added 2026-08-27) versus what's still manual-only (RLS policy behaviour, most UI flows). `npm run lint`/`typecheck`/`test` all passing isn't nothing, but say plainly it doesn't substitute for integration or smoke coverage that doesn't exist yet.*

## Future improvements

*If you had another 4 weeks: what's the prioritised list? Likely candidates already flagged as open debt: TanStack Query for server state, the missing `@/` import alias, integration tests against a local Supabase instance, a Playwright smoke suite, closing the remaining accessibility gaps.*

## Reflection on the AI-assisted process

*How did using Claude Code change how you worked, versus building this solo? What did you accept without much change, what did you push back on or reject outright (a good example: choosing to revert the modal-accessibility and color-contrast fixes from the 2026-08-27 audit after reviewing them), and what does that say about where you drew the line between "AI proposes" and "I dispose"? This overlaps with Section 2 (tool/resource choices) of the written report — you can draw on the same material for both.*
