# 05 - Security Review

> **Status: template, not yet written.** Slotted for Weeks 6–7 (IU12SE-017). This is where you defend the security floor from `CLAUDE.md`, walk through the threat model, and explain the RLS reasoning — the part of the walk-through most likely to get probed line-by-line. Replace each italic prompt with your own writing.

---

## Security floor checklist

*For each row: how is this actually met in the code, and where's the evidence (a specific file, migration, or policy name) a marker could go check? Don't just restate the requirement — show the receipt.*

| # | Requirement | How it's met | Evidence |
|---|---|---|---|
| 1 | Authentication via Supabase Auth | | |
| 2 | At least one RLS policy protects user data | | |
| 3 | No service-role key in client-side code | | |
| 4 | Email verification enabled on signup | | |
| 5 | Input validation on every form field (client + database) | | |
| 6 | No plaintext storage of sensitive data | | |

## Threat model

*Who's the realistic attacker here, and what are they after? This app's actors aren't anonymous internet strangers so much as: (a) an outside attacker with no account, (b) an authenticated user trying to reach data outside their own organisation, (c) a legitimate team member (e.g. an "editor") trying to do something only an "owner"/"admin" should be able to do. For each, what's the worst realistic outcome, and what actually stops it?*

*Worth including as a worked example: on 2026-08-27 an audit found and fixed two real cross-tenant RLS bugs (see `decision-log.md` ADR-0029 and the migration `20260827000000_fix_remaining_rls_gaps.sql`) — a case where actor (b) above could have inserted data into, or gained membership in, an organisation they didn't belong to. Documenting how that bug worked, how it was found, and how the fix closes it is a stronger answer than an abstract threat model alone.*

## RLS reasoning — walk through the policies

*Don't just say "RLS is enabled" — pick 2–3 representative policies and explain the actual logic. Good candidates: why `is_active_org_member()` needs to be `SECURITY DEFINER` (breaking a circular RLS dependency — see the comment in `supabase/migrations/20260601000000_init_schema.sql`), and the `organisation_members`/`containers` INSERT policies referenced above as an example of how an RLS bug looks in practice (a self-referential `WHERE` clause that always evaluates true) and how the fix qualifies the comparison against the correct row.*

## Secrets and key management

*Anon key vs. service-role key — where each lives, why only the anon key ever reaches the browser bundle, and how `.env.local`/`.gitignore` keep both out of git. Confirm (and cite) that a repo-wide check found no service-role key anywhere in `src/`, `desktop/`, or `supabase/`.*

## Known limitations / residual risk

*Be honest here — a marker will trust a review more if it names real gaps rather than claiming everything is solved. Candidates already identified: no Content-Security-Policy yet, the invite-code redemption endpoint has no explicit rate limit, the Supabase password-length minimum is still the 6-character default (low risk today since sign-in is Google-OAuth-only), and the Google OAuth `provider_token` sits in `localStorage` via supabase-js's default session storage. For each: why it's lower priority than the floor items, and what closing it would take.*
