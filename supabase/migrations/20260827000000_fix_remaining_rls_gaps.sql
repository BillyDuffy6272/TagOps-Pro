-- supabase/migrations/20260827000000_fix_remaining_rls_gaps.sql
--
-- Follow-up to 20260610000000_fix_domain_insert_rls.sql, which fixed the
-- "organisation_id = organisation_id" tautology bug on tags/triggers/
-- variables/conversion_events but missed two more instances of the same
-- class of bug, found during a full-repo security audit:
--
-- 1. public.containers — the INSERT policy still has the tautology (never
--    fixed by the 2026-06-10 migration, which didn't cover this table).
--
-- 2. public.organisation_members — the INSERT policy's subquery is FROM
--    the unaliased organisation_members table, which shadows the outer
--    NEW row (same table name). "where organisation_id =
--    organisation_members.organisation_id" therefore resolves BOTH sides
--    to the subquery's own row, not the row being inserted — the same
--    tautology, just spelled differently. Effect: any admin/owner of ANY
--    org could insert an organisation_members row (any role, including
--    'owner') into ANY OTHER organisation. This is a full cross-tenant
--    takeover path and is fixed here by aliasing the subquery (the same
--    pattern already used correctly in this table's own UPDATE/DELETE
--    policies below).
--
-- Also closes a related gap: the UPDATE policy on organisation_members had
-- no WITH CHECK, so an admin could set role='owner' on any membership row
-- via a direct API call, bypassing the app's own rule (enforced only in
-- the UI, see ASSIGNABLE_ROLES in src/features/settings/types.ts) that
-- ownership transfer is deliberately not exposed as a same-tier role
-- change. The fix blocks any UPDATE from setting role to 'owner' — this
-- matches the current app design (the owner row is never targeted by the
-- app's update flow; see MemberRow.tsx's `editable = ... && role !==
-- 'owner'` guard), so it doesn't block any real usage.


-- ── public.containers ────────────────────────────────────────

drop policy if exists "editors can insert containers" on public.containers;
create policy "editors can insert containers"
  on public.containers for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = containers.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.organisation_members ──────────────────────────────

drop policy if exists "admins can insert organisation members" on public.organisation_members;
create policy "admins can insert organisation members"
  on public.organisation_members for insert
  with check (
    exists (
      select 1 from public.organisation_members om
      where  om.organisation_id = organisation_members.organisation_id
        and  om.user_id         = auth.uid()
        and  om.role            in ('owner', 'admin')
    )
  );

drop policy if exists "admins can update organisation members" on public.organisation_members;
create policy "admins can update organisation members"
  on public.organisation_members for update
  using (
    exists (
      select 1 from public.organisation_members om
      where  om.organisation_id = organisation_members.organisation_id
        and  om.user_id         = auth.uid()
        and  om.role            in ('owner', 'admin')
    )
  )
  with check (
    role <> 'owner'
    and exists (
      select 1 from public.organisation_members om
      where  om.organisation_id = organisation_members.organisation_id
        and  om.user_id         = auth.uid()
        and  om.role            in ('owner', 'admin')
    )
  );


-- ── public.conversion_events ─────────────────────────────────
-- value_param and display_name are interpolated into copy-paste JS
-- snippets (src/features/conversions/lib/snippets.ts) that get pasted
-- onto a customer's real website. The generator now escapes/sanitises
-- both defensively, but the same rule applies here as everywhere else in
-- this schema: validate at the DB too, not just the client.

alter table public.conversion_events
  drop constraint if exists conversion_events_value_param_check;
alter table public.conversion_events
  add constraint conversion_events_value_param_check
  check (value_param is null or value_param ~ '^[a-zA-Z_][a-zA-Z0-9_]*$');

alter table public.conversion_events
  drop constraint if exists conversion_events_display_name_no_linebreaks;
alter table public.conversion_events
  add constraint conversion_events_display_name_no_linebreaks
  check (display_name is null or display_name !~ '[\r\n]');
