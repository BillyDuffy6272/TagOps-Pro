-- supabase/migrations/20260809000000_settings_team_management.sql
--
-- Backs the new Settings page's team-management section — the first UI to
-- exercise organisation_members for anything beyond the seed data, closing
-- the MVP "add/remove people + expiry dates" requirement from
-- docs/02-requirements.md.
--
-- Two RLS gaps had to be closed first:
--
-- 1. public.users only allows a user to select their OWN row ("users can
--    select own row"). A team list that joins organisation_members ->
--    users would come back with every teammate's name/email/avatar as
--    null except your own. Teammates genuinely need to see each other's
--    basic profile to manage a shared team, so a second, additive SELECT
--    policy widens this to "anyone who shares an organisation with you" —
--    still fully scoped by organisation membership, never a global
--    directory of every TagOps-Pro user.
--
-- 2. "Add a member by email" needs to look up a user's id from an email
--    address they typed in, but that person is (by definition) not yet a
--    teammate, so gap #1's policy doesn't cover them. Rather than widen
--    the SELECT policy further — which would let any member enumerate
--    arbitrary emails against the entire users table — a narrow
--    SECURITY DEFINER function returns only the handful of fields needed
--    to add someone, and only for an exact email match.

-- ── public.users: teammates can see each other's basic profile ──────────

drop policy if exists "org mates can select each other's profile" on public.users;
create policy "org mates can select each other's profile"
  on public.users for select
  using (
    exists (
      select 1
      from   public.organisation_members mine
      join   public.organisation_members theirs on theirs.organisation_id = mine.organisation_id
      where  mine.user_id   = auth.uid()
        and  theirs.user_id = users.id
    )
  );

-- ── find_user_by_email(): scoped lookup for "add a member by email" ─────

create or replace function public.find_user_by_email(lookup_email text)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.display_name, u.avatar_url, u.email
  from   public.users u
  where  lower(u.email) = lower(trim(lookup_email))
  limit 1;
$$;

revoke all on function public.find_user_by_email(text) from public;
grant execute on function public.find_user_by_email(text) to authenticated;
