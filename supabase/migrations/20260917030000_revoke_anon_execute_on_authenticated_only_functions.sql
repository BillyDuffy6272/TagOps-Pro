-- supabase/migrations/20260917030000_revoke_anon_execute_on_authenticated_only_functions.sql
--
-- Found while testing ADR-0041's new Google Ads functions locally: Postgres
-- confirms (pg_proc.proacl / pg_default_acl) that Supabase's own default
-- privileges grant EXECUTE on every new function in the public schema
-- directly to the `anon` AND `authenticated` roles individually — not to
-- the PUBLIC pseudo-role. `revoke ... from public`, the pattern every prior
-- SECURITY DEFINER function in this project used, does not touch those
-- direct per-role grants at all, so it has silently never actually revoked
-- anything from `anon`.
--
-- For get_invite_code/regenerate_invite_code/redeem_invite_code this is
-- low-severity: each independently checks auth.uid()-derived state inside
-- the function body and raises/fails safely for an anonymous caller
-- (auth.uid() is null with no JWT). Verified directly against a local
-- instance: `set role anon; select get_invite_code(...)` raises "Only
-- owners and admins can view the invite code," not a leak.
--
-- find_user_by_email is a real, live vulnerability, independent of
-- anything built today: it has no internal auth check at all — its
-- comment in 20260809000000_settings_team_management.sql says it's meant
-- to be reachable only by an authenticated teammate typing in an exact
-- email, but the grant meant to enforce that never actually excluded
-- `anon`. Confirmed directly: `set role anon` (zero JWT, exactly what a
-- request carrying only the public anon key produces) can call
-- find_user_by_email(email) and get back any real user's id, display_name,
-- avatar_url, and email — a user-enumeration / PII-disclosure hole
-- reachable by anyone, logged in or not, since the anon key is public by
-- design (security-floor item 3 treats it as safe to expose specifically
-- *because* RLS/grants are supposed to be what actually restricts access).
--
-- None of these four functions are ever called by the app except while
-- authenticated (confirmed: every .rpc() call site is behind a signed-in
-- session) — revoking anon changes no legitimate behaviour.

revoke execute on function public.find_user_by_email(text) from anon;
revoke execute on function public.get_invite_code(uuid) from anon;
revoke execute on function public.regenerate_invite_code(uuid) from anon;
revoke execute on function public.redeem_invite_code(text) from anon;
