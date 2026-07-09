-- supabase/migrations/20260610000000_fix_domain_insert_rls.sql
--
-- Fixes a cross-org privilege escalation bug in the INSERT policies for
-- tags, triggers, variables, and conversion_events (introduced in
-- 20260601000000_init_schema.sql).
--
-- Each broken policy checked:
--   where organisation_id = organisation_id
-- Inside a `with check` subquery against organisation_members, the
-- unqualified `organisation_id` on both sides resolves to
-- organisation_members.organisation_id — a tautology, not a comparison
-- against the row being inserted. Effect: any editor/admin/owner of ANY
-- organisation could insert a row into tags/triggers/variables/
-- conversion_events tagged with a DIFFERENT organisation's id.
--
-- Fix: qualify the right-hand side with the target table's name, matching
-- the pattern already used correctly in this file's UPDATE/DELETE policies.


-- ── public.tags ──────────────────────────────────────────────

drop policy if exists "editors can insert tags" on public.tags;
create policy "editors can insert tags"
  on public.tags for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = tags.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.triggers ──────────────────────────────────────────

drop policy if exists "editors can insert triggers" on public.triggers;
create policy "editors can insert triggers"
  on public.triggers for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = triggers.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.variables ─────────────────────────────────────────

drop policy if exists "editors can insert variables" on public.variables;
create policy "editors can insert variables"
  on public.variables for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = variables.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.conversion_events ─────────────────────────────────

drop policy if exists "editors can insert conversion events" on public.conversion_events;
create policy "editors can insert conversion events"
  on public.conversion_events for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = conversion_events.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );
