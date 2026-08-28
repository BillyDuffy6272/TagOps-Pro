-- supabase/migrations/20260828020000_fix_live_verification_insert_rls.sql
--
-- Fixes a real bug caught by an actual end-to-end anonymous-insert test
-- against the live project (not just review): the INSERT policy on
-- live_verification_events checked `exists (select 1 from conversion_events
-- where ...)` directly, but conversion_events has its own RLS requiring
-- active org membership — and the caller here is the anonymous `anon` role
-- (a business owner's own site, no Supabase session at all). The anon role
-- can't see any conversion_events row through that table's own RLS, so the
-- exists() subquery was always false and every anonymous insert was
-- silently rejected with 42501, regardless of how correct the token was.
--
-- Same fix pattern as is_active_org_member(): wrap the check in a
-- SECURITY DEFINER function so it runs with elevated privilege and can see
-- conversion_events regardless of the caller's own RLS visibility, while
-- only ever answering one narrow boolean question — it can't be used to
-- read or leak any conversion_events data itself.

create or replace function public.conversion_event_belongs_to_org(p_event_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from   public.conversion_events ce
    where  ce.id              = p_event_id
      and  ce.organisation_id = p_org_id
      and  ce.deleted_at is null
  );
$$;

drop policy if exists "anonymous live checks can be recorded" on public.live_verification_events;
create policy "anonymous live checks can be recorded"
  on public.live_verification_events for insert
  with check (
    public.conversion_event_belongs_to_org(conversion_event_id, organisation_id)
  );
