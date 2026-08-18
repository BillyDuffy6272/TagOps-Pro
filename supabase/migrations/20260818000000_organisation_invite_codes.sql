-- supabase/migrations/20260818000000_organisation_invite_codes.sql
--
-- Closes a real onboarding gap: a brand-new user who signs in has a
-- public.users row (via handle_new_user()) but no organisation_members row
-- at all, and nothing in the schema or app let them create one or join an
-- existing one — every organisation-scoped page just errors. "Create" was
-- already possible ("authenticated users can create organisations" + the
-- auto_owner_membership() trigger), so this migration adds the "join" half
-- via a shareable per-organisation invite code.
--
-- The invite code is deliberately NOT a plain readable column: RLS is
-- row-level, so if invite_code were selectable like any other organisations
-- column, "members can select organisations" would let every member down to
-- viewer read (and therefore redistribute) it. Instead:
--   - SELECT and UPDATE on the invite_code column are revoked from
--     `authenticated` outright, so no direct client query can ever read or
--     set it, regardless of row-level policy.
--   - Three SECURITY DEFINER functions are the only way to touch it, each
--     re-checking the caller's role/membership itself rather than relying on
--     the (now-irrelevant, for this column) table RLS policies.

-- ── public.organisations: add the column, lock it down at the column level ──

alter table public.organisations
  add column if not exists invite_code text unique;

alter table public.organisations
  drop constraint if exists organisations_invite_code_check;

alter table public.organisations
  add constraint organisations_invite_code_check
  check (invite_code is null or invite_code ~ '^[A-Z0-9]{8}$');

revoke select (invite_code) on public.organisations from authenticated, anon;
revoke update (invite_code) on public.organisations from authenticated, anon;

-- ── get_invite_code(): owner/admin-only read, generating one on first use ──

create or replace function public.regenerate_invite_code(org_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role    text;
  v_code    text;
  v_attempt int := 0;
begin
  select m.role into v_role
  from   public.organisation_members m
  where  m.organisation_id = org_id
    and  m.user_id         = auth.uid();

  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can regenerate the invite code.';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    begin
      update public.organisations set invite_code = v_code where id = org_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'Could not generate a unique invite code. Please try again.';
      end if;
    end;
  end loop;

  return v_code;
end;
$$;

create or replace function public.get_invite_code(org_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_code text;
begin
  select m.role into v_role
  from   public.organisation_members m
  where  m.organisation_id = org_id
    and  m.user_id         = auth.uid();

  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can view the invite code.';
  end if;

  select o.invite_code into v_code from public.organisations o where o.id = org_id;

  if v_code is not null then
    return v_code;
  end if;

  -- Lazily generate one the first time anybody asks, rather than at every
  -- organisation's creation — most organisations may never need to invite.
  return public.regenerate_invite_code(org_id);
end;
$$;

revoke all on function public.get_invite_code(uuid) from public;
grant execute on function public.get_invite_code(uuid) to authenticated;
revoke all on function public.regenerate_invite_code(uuid) from public;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;

-- ── redeem_invite_code(): self-service join for any authenticated user ──
--
-- Grants the joiner the 'editor' role with no expiry — a sensible default
-- for someone deliberately handed a code by their team, distinct from the
-- more cautious per-person role/expiry an owner/admin sets explicitly via
-- "Add a member" in Settings.

create or replace function public.redeem_invite_code(code text)
returns table (
  organisation_id uuid,
  organisation_name text,
  already_member boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id   uuid;
  v_org_name text;
  v_already  boolean;
begin
  select o.id, o.name into v_org_id, v_org_name
  from   public.organisations o
  where  o.invite_code = upper(trim(code))
    and  o.deleted_at is null;

  if v_org_id is null then
    return; -- empty result set signals "invalid code" to the caller
  end if;

  select exists (
    select 1 from public.organisation_members m
    where  m.organisation_id = v_org_id
      and  m.user_id         = auth.uid()
  ) into v_already;

  if not v_already then
    insert into public.organisation_members (
      display_id, organisation_id, user_id, role, joined_at, expires_at
    )
    values (
      'MEMID_XX_' || lpad(nextval('public.member_display_id_seq')::text, 4, '0'),
      v_org_id, auth.uid(), 'editor', now(), null
    );
  end if;

  return query select v_org_id, v_org_name, v_already;
end;
$$;

revoke all on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;
