# 07 - Evaluation

## Requirements traceability

Against `02-requirements.md`'s MUST HAVE / MVP list:

| Requirement | Status | Notes |
|---|---|---|
| Organisation for Tags, Triggers, Variables (with dropdown pickers) | **Met** | One view per entity type; `ContainerPicker` provides the dropdown selection |
| Organisation for Conversion events; link a container to a Google Ads conversion ID and generate ready-to-paste tracking code | **Removed (28/08/2026)** | Built (Conversions view, `GoogleAdsSettingsModal`, `snippets.ts`, `ConversionSnippetModal`, live firing verification), then removed entirely — code, database tables, all docs. The requirement's real value depended on live data from the Google Ads API, which needs a developer token subject to Google's own approval process; not safe to depend on this close to the deadline. See `decision-log.md` ADR-0038 |
| An intuitive UI, easy navigation | **Met** | Sidebar nav with active-state highlighting, plus the Home page's own "what each page shows" guide added specifically to address unfamiliarity |
| Create an account under 2 minutes using Google | **Met** | Single-click Google OAuth sign-in, no separate account form |
| Secure and confidential account | **Met** | Supabase Auth + RLS on every table; see `05-security-review.md` for the full case |
| Put all actual setup info into the site within 10 minutes | **Met, with a caveat** | Tag/trigger/variable data isn't manually entered at all — it's read live from GTM the moment the OAuth scope is granted, which is faster than the original 10-minute target implies but is a different mechanism than "entering" data |
| Create or join an organisation, including via a shareable invite code | **Met** | `OrganisationOnboarding` (create) and invite-code redemption via `redeem_invite_code()` (join) — ADR-0023 |
| Add people to an organisation | **Met** | `AddMemberModal`, gated to owner/admin |
| Remove people, with an expiry date | **Met** | `removeOrganisationMember`; `expires_at` column, enforced by a `CHECK` constraint that owners can never expire |
| All initial data loads after linking | **Met** | `GtmContext` loads accounts/containers as soon as a session with a `provider_token` exists |
| Readable, easily viewable text | **Partial** | Generally true, but the accessibility audit found some text-color tokens (`text-tertiary`, `text-faint`) fall slightly short of WCAG AA contrast in places — see `06-front-end-architecture.md` |
| Can see if the account is properly linked and accurately reflects the real Google account | **Met** | Home page's "GTM connected / disconnected" indicator; `GtmForbiddenState` surfaces a 403 distinctly from a generic error |
| Different user roles, each genuinely limiting/granting access | **Met** | Owner/Admin/Editor/Viewer, enforced at the database via RLS (not just hidden UI) — see ADR-0031. Editor+ can write, Viewer is read-only |
| A Viewer can request to be upgraded; an Owner/Admin approves or denies it | **Met** | `access_requests` table + RLS (ADR-0031); approving actually promotes the member's role, not just a status flag |

Against the WOULD BE NICE list — several shipped even though they weren't required:

| Requirement | Status | Notes |
|---|---|---|
| View specific tag/trigger/variable in detail | **Met** | Per-entity detail modals |
| Change the theme | **Met** | Light/Dark/System, ADR-0027 |
| Small summary before expanding | **Met** | `EntityRow` cards show key metadata before the detail modal opens |
| Contrast improvements for menu/dashboard | **Partial** | Sidebar contrast was explicitly revisited (see commit history); some color tokens still fall short of AA per the accessibility audit |
| See which page you're on | **Met** | Active nav item is visually highlighted, plus `aria-current="page"` for assistive tech |
| Home page explaining what each page shows, collapsible | **Met** | Built this session, then converted to a collapsed-by-default disclosure after feedback that it looked crowded |
| Search/filter tags, triggers, variables by name | **Met** | A search input on each of the three list views |
| Preview mode for dataLayer inspection | **Met — worth flagging** | This item also appears, contradictorily, on the *Out of scope* list in the same requirements document — now annotated there directly rather than left as a silent inconsistency. It got built anyway (`PreviewView`/`simulator.ts`), which reads as positive over-delivery rather than scope creep |
| Verify tag setup is actually operational/running | **Not met** | Also listed under both "Would be nice" and "Out of scope" in the source document. Consistent with the out-of-scope framing: this would require the app to load a real page, which it deliberately never does (see the "no real page" boundary documented in the Preview feature's own ADRs) |

Every *Out of scope* item was checked and confirmed correctly absent: no AI suggestion feature, no ability to make real changes to GTM/GA4 from the app, no two-way sync, no support-contact feature. The one already-noted exception is dataLayer preview, which is out-of-scope on paper but shipped in practice.

## What went well

- **RLS-first design held up under real audit pressure.** All ten domain tables have RLS enabled with no blanket-permissive policy; when two real bugs were found, they were found by policy-by-policy review, not by a live exploit — the database refused to let a corrupted UI state cause real damage in the meantime.
- **TypeScript discipline.** Zero `any` and zero `@ts-ignore`/`@ts-expect-error` anywhere in `src/`, confirmed by a full-repo audit — genuinely better than the median for a project this size.
- **A consistent error-handling convention, actually followed.** `CLAUDE.md`'s "never swallow errors silently" rule is honoured everywhere checked; the one systemic bug in this area (PostgREST's plain-object errors silently becoming a generic fallback message, ADR-0024) was root-caused and fixed with a single `toError()` helper rather than patched call-site by call-site.
- **A working, if small, automated test suite.** 29 tests in `tests/unit/simulator.test.ts`, covering the Preview mode dataLayer/tag-firing simulator — the one remaining area `CLAUDE.md` requires unit tests for. `snippets.test.ts` carried two adversarial tests (added specifically because a real injection bug had slipped past happy-path-only coverage) until the conversion-event feature it tested was removed entirely (ADR-0038); the pattern those tests demonstrated — adding a regression test *because* something already went wrong once — is worth keeping in mind for whatever's tested next.

## What was challenging / what changed from the plan

Several real bugs are on permanent record in `decision-log.md` rather than smoothed over:

- **ADR-0024** — a codebase-wide bug where every Supabase error was silently replaced with a generic fallback message, because PostgREST returns a plain object rather than a real `Error` and nothing called `.throwOnError()`. This hid the actual cause of an organisation-creation failure for longer than it should have.
- **ADR-0025** — `INSERT ... RETURNING` re-checks the result against the table's `SELECT` policy, which for a brand-new organisation only passes once a trigger-created membership row exists — a genuinely subtle interaction between PostgREST's default behaviour and RLS that isn't obvious from either piece in isolation.
- **ADR-0026** — an ambiguous foreign-key embed (`organisation_members` has two FKs into `users`) silently broke a `Promise.all`, which took out an unrelated field on the same page and looked at first like a completely different bug.
- **ADR-0029** — the same class of RLS tautology bug (`WHERE organisation_id = organisation_id`) was fixed once in June and found again, in two more places, during an August audit. The recurrence is the real lesson: finding and fixing one instance of a bug pattern doesn't mean a codebase is free of every instance of that pattern.

## Security floor self-assessment

All six security-floor requirements are met — see `05-security-review.md` for the full table with evidence. The more honest framing than "the floor is met" is that the floor is a *process*, not a one-time checkbox: two of the six items (RLS, input validation) were only fully correct after a dedicated audit found real gaps in already-shipped code. A review that only checks "is there a policy on this table" would have missed both bugs; checking "does the policy compare against the *right* row" is what actually caught them.

## Accessibility self-assessment

See `06-front-end-architecture.md` for the full list. The honest summary: forms, keyboard interaction, and screen-reader announcements for state changes are solidly implemented. Two known gaps — modal dialog semantics and some color-contrast tokens — were identified, fixed, verified, and then *deliberately reverted* at the project owner's explicit request during review. That's a real trade-off made consciously, not a gap that went unnoticed; it's recorded here so it doesn't quietly disappear before the walk-through.

## Testing summary

See `08-test-plan.md` for the full breakdown. In short: unit tests exist and pass (29/29) for dataLayer-touching logic, per `CLAUDE.md`'s requirement, but there is no integration layer testing RLS policy behaviour directly and no Playwright smoke suite yet, despite both being named in the mandated repo layout. `npm run lint`/`typecheck`/`test` all passing is a real signal, but it isn't equivalent to that missing coverage.

## Future improvements

In priority order if development continued: an integration test suite that impersonates two different users in two different organisations against a local Supabase instance (the kind of test that would have caught the RLS bugs directly, rather than by manual review); TanStack Query to replace the currently-duplicated fetch-orchestration logic across five views; a Playwright smoke suite; the missing `@/` import alias; a Content-Security-Policy; rate limiting on invite-code redemption; and closing the two deliberately-deferred accessibility gaps.

## Reflection on the AI-assisted process

Claude Code was used throughout for architecture suggestions, a full-repo security/accessibility/code-quality audit, debugging, and drafting this folio's structure. The clearest evidence that "AI proposes, I dispose" was followed in practice rather than just stated: two AI-implemented, AI-verified fixes (the modal accessibility rewrite and the color-contrast pass) were explicitly rejected and reverted after review, for reasons that were the project owner's call to make, not the AI's to argue against. Separately, AI-found bugs (the RLS tautology, the snippet-injection gap) were accepted specifically because they came with a concrete, reproducible failure scenario and a verifiable fix — not just a claim. The pattern that held up best across the term: treat AI output as a draft to interrogate, not an answer to accept, and keep a written record (`decision-log.md`, `ai-use-log.md`) of which was which.
