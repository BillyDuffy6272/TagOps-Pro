# 09 - Iteration Log

A running record of this project's iterations: the development history (what was built, in what order, sourced from `git log`), plus user acceptance testing (UAT) feedback and deployment incidents as they happen. New entries in the UAT/deployment tables go at the bottom, oldest first, matching `ai-use-log.md`'s convention; the development history below is current through commit `7ec8990` (28/08/2026) and should be extended the same way (grouped under the next iteration number) as work continues.

**Naming note (resolved 28/08/2026):** This file was originally `09-iteration.md`, mismatching `CLAUDE.md`'s required repo shape and `README.md`'s own folio index, both of which named it `09-iteration-log.md`. Renamed to match — see `decision-log.md`.

---

## Part 1 — Development iteration history

Every commit, in order, grouped under the iteration numbers already used in the commit messages themselves (`N`, `N.1`, `N.1.1`, ...) — reconstructed from `git log --reverse`, not from memory. Nothing here has been renumbered or reworded beyond what's in the commit message itself.

### Setup & initial MVP (pre-numbering)

| Date | Commit | What happened |
|---|---|---|
| 06/05/2026 | `5386b88` | Initial commit |
| 06/05/2026 | `29997ec` | Test Commit |
| 06/05/2026 | `00b659a` | Add Vite React TypeScript project scaffold |
| 07/05/2026 | `690d366` | Add AI and decision log documentation files |
| 07/05/2026 | `06b3fde` | Build initial TagOps Pro MVP with GTM integration |
| 11/05/2026 | `f5db5ad` | Add problem statement and requirements documentation |
| 13/05/2026 | `93c271a` | Claude Integration for Optimisation |
| 27/05/2026 | `29aad0d` | Creation of planning + JSON Data Dictionary's, in addition to AI use logs |
| 03/06/2026 | `41b6619` | Add seed data for development and demo purposes (`supabase/seed.sql`) |
| 10/06/2026 | `3c8d24e` | Successfully enabled Google sign-in and authentication — first working frontend design |
| 08/07/2026 | `842d4f6` | Fix broken production build by removing a stray tag from generated types |
| 09/07/2026 | `b77975d` | Fixed production errors — first fully operational deployment |
| 09/07/2026 | `d130891` | 2nd redeployment, attempting to update operation |

### Iteration 3 — Triggers & Variables fixes

| Date | Commit | What happened |
|---|---|---|
| 10/07/2026 | `57c5cfc` | 3rd redeployment, fixing Triggers + Variables |
| 10/07/2026 | `ff1a6d9` | 3.1 — Fixing trigger description |
| 10/07/2026 | `7d4a76b` | 3.2 — Variables fix, consistent theme |

### Iteration 4 — Tag detail view

| Date | Commit | What happened |
|---|---|---|
| 10/07/2026 | `bfab1da` | 4. Tags — showing more info + detail, first attempt |

### Iteration 5 — Interface redesign

| Date | Commit | What happened |
|---|---|---|
| 10/07/2026 | `d41c4be` | 5. UI interface change |
| 10/07/2026 | `c8f59c9` | 5.1 — 2nd attempt at an interface redo |
| 10/07/2026 | `2e7d9d0` | 5.1.1 — Nav bar updates |
| 10/07/2026 | `09a4aa9` | 5.1.2 — Structuring updates to Tags, Triggers, Variables, and Conversion events |

### Iteration 6 — Conversion events & Preview

| Date | Commit | What happened |
|---|---|---|
| 10/07/2026 | `a601d33` | 6. Conversion Event restructure + creation |
| 10/07/2026 | `bd506f9` | 6.1 — Conversion Event, attempt 2 |
| 19/07/2026 | `2f6cfb1` | 6.2 — Conversions, work in progress |
| 08/08/2026 | `3e01482` | 6.3 — Pop-up menus for Triggers/Variables, mirroring the Tags pop-up |
| 08/08/2026 | `62621f5` | 6.4 — Summary page for Preview mode (what has fired / not fired) |
| 08/08/2026 | `7931e49` | 6.4.1 — Changes to the Preview tabs, more in-depth info |
| 09/08/2026 | `1065d91` | 6.5 — Minor update to the Home page |

> **Note (added 28/08/2026, not part of the original git-log transcription):** Conversion events, the feature built across this iteration, was removed entirely on 28/08/2026 — code, database tables, and every doc reference. See `decision-log.md` ADR-0038. Left the rows above exactly as reconstructed from `git log`, per this file's own rule against renumbering or rewording history.

### Iteration 7 — Profile, Settings, Organisation

| Date | Commit | What happened |
|---|---|---|
| 09/08/2026 | `dc038d3` | 7. Profile + Settings creation |
| 18/08/2026 | `bba9650` | 7.1 — Team + Organisation updates |
| 19/08/2026 | `86b1168` | 7.1.1 — Organisation creation _(commit message reads "7.1..1")_ |
| 19/08/2026 | `0d9abf8` | 7.1.2 — Organisation creation, work in progress |
| 19/08/2026 | `35d30b2` | 7.2 — Organisation still a work in progress |

### Iteration 8 — Menu bar contrast

| Date | Commit | What happened |
|---|---|---|
| 25/08/2026 | `8a74e8e` | 8. Menu bar contrast |

### Iteration 9 — Light/Dark theming

| Date | Commit | What happened |
|---|---|---|
| 25/08/2026 | `6d58c3c` | 9. Light/Dark switch |
| 26/08/2026 | `7294c51` | 9.1 — Theme updates |

Documented in full in `decision-log.md` ADR-0027: token-level theming via CSS custom properties rather than a second stylesheet, so every existing Tailwind utility resolves correctly in both themes automatically.

### Iteration 10 — Preview page updates

| Date | Commit | What happened |
|---|---|---|
| 26/08/2026 | `d93a070` | 10. Preview page updates |

### Iteration 11 — Clean sweep & Home page redesign

| Date | Commit | What happened |
|---|---|---|
| 27/08/2026 | `7868b9c` | 11. Clean sweep for errors + Home page redesign |
| 27/08/2026 | `a52de19` | 11.1 — Reattempt at publishing the changes made in 11 |
| 28/08/2026 | `9c444dd` | 11.2 — Small tweaks |
| 28/08/2026 | `0e5a90c` | 11.3 — Home page tweak |
| 28/08/2026 | `a325f87` | 11.4 — Icon colour fix |
| 28/08/2026 | `67661db` | 11.5 — User role access updates |
| 28/08/2026 | `8b5b92b` | 11.5.1 — Reattempt at updating access for user roles |

This is the iteration during which the full security/accessibility/code-quality audit was run (two RLS bugs and a snippet-injection bug found and fixed, several accessibility fixes applied), and the Home page's "what each page shows" guide was added and refined into its current collapsible form — see `decision-log.md` ADR-0029 and ADR-0030, and the corresponding entries in `ai-use-log.md`, for the full detail behind these commits. The role-access rows (`67661db`/`8b5b92b`) correspond to ADR-0031 — Editor/Viewer roles genuinely differ now, enforced at the database, with a request-access flow for viewers; the icon-colour row (`a325f87`) corresponds to ADR-0032.

### Iteration 12 — Landing page

| Date | Commit | What happened |
|---|---|---|
| 28/08/2026 | `1a12402` | 12. Landing page |

A marketing/landing page shown to signed-out visitors before the Google sign-in screen — see `decision-log.md` ADR-0034.

### Iteration 13 — Real firing verification

| Date | Commit | What happened |
|---|---|---|
| 28/08/2026 | `6d77912` | 13. Real firing verification |

A console-paste snippet that confirmed a conversion event actually fired on a business owner's real site, as opposed to Preview mode's local simulation — see `decision-log.md` ADR-0035. Removed entirely in Iteration 15 below, along with the rest of conversion-event tracking.

### Iteration 14 — Finishing touches

| Date | Commit | What happened |
|---|---|---|
| 28/08/2026 | `e72c447` | 14. Finishing touches |

Reworded the "Link Google Ads" UI (a button, a status dot, "Linked"/"Not linked" labels) to describe what it actually did — a manually-typed conversion ID field, not a real Google Ads OAuth connection — see `decision-log.md` ADR-0036.

### Iteration 15 — Removing conversion-event tracking

| Date | Commit | What happened |
|---|---|---|
| 28/08/2026 | `d07b751` | 15. Removing conversions |

Investigating a real Google Ads API integration (ADR-0037) surfaced a developer-token approval process outside anyone's control, with no guaranteed timeline — too complicated and too risky this close to the fixed deadline. Conversion-event tracking was removed entirely: `src/features/conversions/`, its database tables (pushed live), and every doc reference — see `decision-log.md` ADR-0038.

### Iteration 16 — Post-removal cleanup

| Date | Commit | What happened |
|---|---|---|
| 28/08/2026 | `17ea1a4` | 16. More finishing touches |
| 28/08/2026 | `b58c338` | 16. Post-removal cleanup: rebuild request-access UI, fix stale docs |

> Both commits carry the same self-assigned iteration number ("16.") — not two colliding pieces of work, but one: `17ea1a4` is just the `09-iteration.md` → `09-iteration-log.md` rename, committed a moment before the rest of the same cleanup pass (rebuilding the request-access UI orphaned by Iteration 15's removal, fixing a stale `README.md` status section, adding `.env.example`) landed in `b58c338`. See `decision-log.md` ADR-0039.

### Iteration 17 — RLS integration and Playwright smoke test suites

| Date | Commit | What happened |
|---|---|---|
| 28/08/2026 | `7ec8990` | 17. Add RLS integration and Playwright smoke test suites |

`tests/integration/rls.test.ts` (7 tests targeting the ADR-0029/0033 cross-tenant bug class directly) and `tests/smoke/landing-login.spec.ts` (3 Playwright tests, actually run and passing). The two are **not** equally verified — the smoke suite was executed against a real build; the RLS suite was written directly against the real schema/policies but has never run, since the environment that wrote it had no Docker for `supabase start`. See `decision-log.md` ADR-0040 and `08-test-plan.md`.

---

## Part 2 — UAT feedback log

One session so far, added 28/08/2026 from the project owner's own summary of the class's feedback (not independently observed — see the note below the table).

| Date | Tester | What they tried | Feedback | Action taken |
|---|---|---|---|---|
| 24/08/2026 | Classmates (school class testing session) | Clicked through the dashboard and sidebar navigation | Wanted more visual contrast between the menu/sidebar and the dashboard content | Addressed the very next day — Iteration 8, `8a74e8e` "Menu bar contrast" (25/08/2026) |
| 24/08/2026 | Classmates (school class testing session) | Explored organisation/team management | Wanted proper roles for organisations, not just flat membership | Addressed in Iteration 11.5/11.5.1 (`67661db`/`8b5b92b`) — Owner/Admin/Editor/Viewer roles made genuinely different and enforced at the database, plus a viewer request-access flow. See `decision-log.md` ADR-0031 |
| 24/08/2026 | Classmates (school class testing session) | Used the Conversions feature (conversion events, Google Ads linking) | Found it too technical / hard to follow | Investigated a real fix (pulling live data from the Google Ads API, ADR-0037) but that needed external developer-token approval outside project control — too complicated and too risky this close to the deadline, so the feature was removed entirely rather than partially simplified. See `decision-log.md` ADR-0038, Iteration 15 (`d07b751`) |
| 24/08/2026 | Classmates (school class testing session) | Overall click-through | Overall positive — described as nice, easy to use, and accessible | No action needed; recorded as a positive signal alongside the specific asks above |

> **Note on sourcing:** unlike Part 1 (from `git log`) or the ADRs this table cross-references (each independently verified during the session that made the change), this table's Date/Tester/Feedback columns are transcribed from the project owner's own account of the session, given after the fact rather than observed directly — no separate tester notes, recording, or written feedback form exists to check against. The "Action taken" columns are independently verifiable (real commits/ADRs), but the feedback itself rests on the owner's memory of the class's response, worth being upfront about at the walk-through.

## Part 3 — Deployment iteration log

Distinct from Part 1 above: this table is for incidents that only surfaced once code was live on Vercel/Supabase (a failed build, a misconfigured environment variable, a migration that needed reapplying) — not the routine "built a feature" entries already captured as development iterations. None have been logged yet.

| Date | What happened | Fix |
|---|---|---|
| _(no incidents logged yet)_ | | |

## Open feedback backlog

_(empty — nothing has been reported yet that isn't already captured as a known gap in `07-evaluation.md` or `08-test-plan.md`)_

---

## Reading this alongside the other logs

- **This file, Part 1** — the literal sequence of what was built and when, sourced from `git log`.
- **This file, Parts 2–3** — outside feedback and live-deployment events, as the AT3 brief requires.
- **`decision-log.md`** — *why* a given technical or product choice was made, with trade-offs; most iterations from 9 onward correspond directly to one or more numbered ADRs (9→0027, 11→0029/0030/0031/0032, 12→0034, 13→0035, 14→0036, 15→0038, 16→0039, 17→0040).
- **`ai-use-log.md`** — the substantive Claude Code interactions behind that work, per the AT3 AI Use Policy.
