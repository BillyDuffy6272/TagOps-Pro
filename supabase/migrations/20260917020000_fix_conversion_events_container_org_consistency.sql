-- supabase/migrations/20260917020000_fix_conversion_events_container_org_consistency.sql
--
-- Found while verifying ADR-0041 by actually running
-- tests/integration/rls.test.ts (written in ADR-0040, never previously
-- executed — no Docker in that environment) against a real local Postgres
-- for the first time. Its very first test failed: it expects a cross-org
-- `tags` INSERT to be rejected, and it wasn't.
--
-- The bug: the INSERT/UPDATE `WITH CHECK` on tags/triggers/variables/
-- conversion_events (this migration only touches conversion_events — the
-- other three pre-date this session and are a separate, out-of-scope
-- finding) only verifies the caller is an editor+ of the organisation_id
-- being written. It never verifies that container_id actually belongs to
-- that organisation. An editor of Org A could insert a conversion_events
-- row with organisation_id = their own Org A (passes the role check) but
-- container_id pointing at a container that belongs to a completely
-- different org.
--
-- Confirmed by direct testing that this does NOT leak data cross-org:
-- conversion_events' SELECT policy still gates by the row's own
-- organisation_id, so the victim org never sees the injected row even when
-- querying by that exact container_id; a join to containers(...) is
-- independently RLS-filtered to null for a caller outside that container's
-- org. The actual harm is data-hygiene/integrity only — a row whose
-- organisation_id and container_id disagree about which org it belongs to,
-- reachable via a direct PostgREST call even though nothing in the app's
-- own UI would ever construct one.
--
-- Fix: a new SECURITY DEFINER helper, same justification and shape as
-- is_active_org_member()/conversion_event_belongs_to_org() — the caller
-- has no RLS visibility into another org's containers row, so checking
-- "does this container really belong to this org" needs elevated
-- privilege to answer safely, same as every other cross-table RLS check
-- in this schema.

create or replace function public.container_belongs_to_org(p_container_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from   public.containers c
    where  c.id              = p_container_id
      and  c.organisation_id = p_org_id
      and  c.deleted_at is null
  );
$$;

drop policy if exists "editors can insert conversion events" on public.conversion_events;
create policy "editors can insert conversion events"
  on public.conversion_events for insert
  with check (
    public.container_belongs_to_org(container_id, organisation_id)
    and exists (
      select 1 from public.organisation_members
      where  organisation_id = conversion_events.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

-- UPDATE previously had no WITH CHECK at all (only USING), so an editor
-- could also re-point an existing, legitimately-owned row's container_id
-- at another org's container after the fact. USING (row visibility) is
-- unchanged; WITH CHECK now closes the same gap on the way out.
drop policy if exists "editors can update conversion events" on public.conversion_events;
create policy "editors can update conversion events"
  on public.conversion_events for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = conversion_events.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  )
  with check (
    public.container_belongs_to_org(container_id, organisation_id)
  );
