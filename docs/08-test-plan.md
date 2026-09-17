# 08 - Test Plan

## Test layers

| Layer | Purpose | Run with | Status |
|---|---|---|---|
| `tests/unit/` | Pure logic, no live Supabase/GTM needed | `npm run test` (Vitest) | **Implemented and verified** — 3 files, 44 tests, all passing |
| `tests/integration/` | Policy tests against a local Supabase instance (RLS behaviour) | `supabase start`, then `npm run test:integration` | **Implemented and run** — written 28/08/2026 (ADR-0040), actually executed for the first time 18/09/2026 (ADR-0042) once Docker was available. 11/12 pass — the one known failure (a `tags` cross-org gap, pre-existing and left unfixed by design — see `05-security-review.md`) is a real, documented finding, not a fixture bug |
| `tests/smoke/` | End-to-end critical flows in a real browser | `npm run test:smoke` (Playwright) | **Implemented and verified for what it covers** — 3 tests, all passing, but scoped to the signed-out Landing/Login flow only (see below for why) |

## Current unit coverage

Three files:

- **`tests/unit/simulator.test.ts`** (29 test cases) — covers `src/features/preview/lib/simulator.ts`, the logic behind the Preview page's dataLayer/tag-firing simulation. Tests the resolution of built-in GTM variables, trigger matching logic, and the deliberate "unresolved, with a reason" behaviour for variables that would require a real loaded page (Page URL/Hostname/Path, Referrer) — the simulator is designed to never fabricate those from TagOps-Pro's own URL, and that boundary is directly tested. Chosen specifically because `CLAUDE.md` requires unit tests for anything that reads or pushes to `window.dataLayer`.
- **`tests/unit/snippets.test.ts`** (7 test cases) — the conversion-event tracking-code generator, including two adversarial injection tests added 27/08/2026 after a real vulnerability was found (see `05-security-review.md`). Removed along with the feature (ADR-0038), restored unchanged when the feature was re-added (ADR-0041, 17/09/2026).
- **`tests/unit/googleAds.test.ts`** (8 test cases, new 17/09/2026, ADR-0041) — only the pure/testable pieces of the new Google Ads OAuth integration: the customer-ID format validator (both the client's and the Edge Function's copy), the GAQL query builder, and the Ads API response-parsing function. **Deliberately does not, and cannot, cover** the actual token exchange or the live Google Ads API call in `supabase/functions/google-ads-report/index.ts` — no real developer token exists (ADR-0037), so that path has never been exercised against a live endpoint. This is a real, flagged gap, not an oversight: everything upstream of it (the OAuth connect flow, the RLS/role checks in both Edge Functions, the Vault-based token storage) has been reasoned through and, for the OAuth grant itself, is genuinely testable by hand with a real Google account today.

Runs with zero external dependencies (no network, no database), which is why this was the first layer built.

## RLS / security testing strategy

The two real RLS bugs fixed on 27/08/2026 (`containers` and `organisation_members` INSERT policies both had a self-referential `WHERE organisation_id = organisation_id` clause that made the check a no-op) were found by manual code review during an audit — nothing automated in this repository caught either one at the time.

**`tests/integration/rls.test.ts`** (added 28/08/2026, ADR-0040) is a direct answer to that gap: it impersonates two different authenticated users belonging to two different organisations — via `set_config('request.jwt.claims', ...)` plus `SET LOCAL ROLE authenticated` inside a transaction that always rolls back, the same mechanism PostgREST itself uses per request, matching the technique already used for manual debugging in ADR-0025 — then asserts that a cross-organisation write is rejected. Seven tests, each tied to a real, documented threat rather than generic coverage:

- Cross-org `tags` INSERT rejected, same-org INSERT succeeds (positive control)
- Cross-org `tags` SELECT returns zero rows rather than erroring, same-org SELECT returns the row (positive control)
- Cross-org `organisation_members` INSERT rejected — the exact ADR-0029/ADR-0033 cross-tenant takeover bug, attempting the worst case directly (inserting an `'owner'` row into someone else's org)
- `organisation_members` UPDATE cannot set `role = 'owner'`, even for an admin who can otherwise update that row
- An expired membership (`expires_at` in the past) is treated as inactive, blocking a write that an active membership in the same role would allow

**Update, 18/09/2026 (ADR-0042): actually run for the first time, once Docker was available.** 6 of the 7 tests above passed on the first run. The 7th — cross-org `tags` INSERT — failed, and was investigated rather than dismissed as a fixture bug: it's real. The `tags` (and `triggers`/`variables`/`conversion_events`) INSERT policies check that the caller belongs to the `organisation_id` being written, but never check that `container_id` actually belongs to that same organisation — a gap distinct from the self-referential-subquery bug above. Confirmed directly (impersonating both sides under `set role`) that this does not leak data cross-org, only allows an internally-inconsistent row to be created. Fixed for `conversion_events` (`20260917020000_fix_conversion_events_container_org_consistency.sql`) since that's the table currently in active use; left open for `tags`/`triggers`/`variables`, which the app never actually queries (see `05-security-review.md`). Two new test groups were added alongside this fix: `conversion_events — container/organisation consistency` (the fix, verified) and `anonymous access to authenticated-only functions` (a second, unrelated finding from the same session — see below) — bringing the suite to 12 tests, 11 passing, one documented and intentionally still failing.

Also found in the same pass, unrelated to the tests above: `get_google_ads_refresh_token` (ADR-0041's own new code) and the pre-existing `find_user_by_email` (three weeks old) were both callable by an anonymous caller with zero session, because Supabase grants function `EXECUTE` to `anon`/`authenticated` directly, and `revoke ... from public` never touches that. `find_user_by_email` had no internal check to fail behind, making it a real, live PII-disclosure bug. Both fixed — full detail in `decision-log.md` ADR-0042 and `05-security-review.md`'s RLS reasoning section.

## Smoke test coverage

**`tests/smoke/landing-login.spec.ts`** (added 28/08/2026, ADR-0040) — 3 Playwright tests, run against a real production build (`npm run build` + `vite preview`, not the dev server) and actually executed and passing, not just written: Landing renders and its "Get started" button leads into the real Login screen; Login's logo returns to Landing; and no console errors occur across that flow.

**Deliberately scoped to the signed-out flow only.** Every other view (Tags, Settings, Organisation, etc.) requires a real, Google-authenticated Supabase session, and there's no way to fake one safely here: a hand-crafted JWT would satisfy the client's own "am I logged in" check, but would fail signature validation on every real Supabase query, so it wouldn't actually prove those views work — it would just prove the login gate can be bypassed, which isn't the same thing and isn't a test worth having. Automating the authenticated flows would need a stored, real, valid session (Playwright's `storageState`, captured from an actual sign-in) — not attempted here. Manual click-through remains how the authenticated app is verified, per the checklist below.

## Manual testing / walkthrough checklist

What actually gets clicked through before a change is considered done, in the absence of the automated coverage above:

- Sign in with Google from a signed-out state
- A brand-new account: land on `OrganisationOnboarding`, create an organisation, confirm it appears correctly
- Join an existing organisation via an invite code
- Every primary view loads without error: Home, Tags, Triggers, Variables, Conversions, Preview, Settings, Organisation
- Add a team member, set an expiry date, confirm it's editable and removable; confirm the owner row is not editable
- Toggle Light / Dark / System theme and confirm it persists across a reload
- Disconnect/reconnect the Google account and confirm `GtmForbiddenState` renders correctly on a 403 rather than a generic error
- Create a conversion event, generate its snippet, and run the console-paste live-verification check against a real page (ADR-0035's original flow, restored ADR-0041)
- Click "Connect Google Ads" as an owner/admin, complete the `adwords` consent screen with a real Google account, enter a customer ID, and confirm the panel shows "Connected" (ADR-0041) — the one part of the new Google Ads work that's actually verifiable today
- Click "Load live conversion data" and confirm it returns `developer_token_not_configured`, not a raw error — this is the currently-correct, expected result, not a bug, until a real developer token exists

## Known gaps

Stated plainly rather than implied: the RLS integration suite has now been run (ADR-0042) and passes 11/12 — the one known failure is the `tags`/`triggers`/`variables` container/organisation-consistency gap (see `05-security-review.md`), left open by design since those tables aren't queried by the app today. The smoke suite still covers only the signed-out flow, and there are no component-level tests for individual React components (unit coverage today is pure-logic modules only). The Google Ads live-report path (`supabase/functions/google-ads-report`) has never been run against a real Ads API endpoint — no developer token exists, an external Google approval process outside this project's control (ADR-0037/ADR-0041) — though its auth/membership/role-gate logic and its Vault-backed storage round-trip *have* been verified end-to-end over real HTTP against a real local session (ADR-0042). Open items: deciding whether authenticated smoke coverage is worth the `storageState` setup; fixing (or deliberately deferring) the `tags`/`triggers`/`variables` gap if those tables are ever put to real use; eventually verifying the live Ads report call once a developer token exists.
