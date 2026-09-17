-- supabase/migrations/20260917000000_readd_conversion_tracking.sql
--
-- Re-adds conversion-event tracking, removed on 2026-08-28
-- (20260828030000_remove_conversion_tracking.sql, decision-log.md ADR-0038).
-- Never edit an applied migration — this recreates, forward, exactly what
-- was dropped, already including every fix that had landed by the time it
-- was removed:
--   - conversion_events + RLS, incl. the June cross-org INSERT-policy fix
--     (20260610000000_fix_domain_insert_rls.sql)
--   - conversion_label/category on conversion_events + google_ads_conversion_id
--     on containers (20260710000000_google_ads_conversion_tracking.sql)
--   - the August injection-fix CHECK constraints on value_param/display_name
--     (20260827000000_fix_remaining_rls_gaps.sql)
--   - live_verification_events + the anonymous-insert RLS fix via
--     conversion_event_belongs_to_org() (20260828010000/020000)
--
-- See decision-log.md ADR-0039 for why this was re-added and what's new
-- on top of it (the google_ads_connections table added in the next
-- migration, 20260917010000_google_ads_connections.sql).

-- ============================================================
-- public.conversion_events
-- ============================================================

create table if not exists public.conversion_events (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^CONID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id)     on delete cascade,
  organisation_id  uuid        not null references public.organisations(id),
  event_name       text        not null
                               check (event_name ~ '^[a-z_][a-z0-9_]*$'),
  display_name     text,
  value_param      text,
  currency         text        default 'AUD'
                               check (char_length(currency) = 3),
  conversion_label text,
  category         text        not null default 'other',
  is_active        boolean     not null default true,
  notes            text,
  created_at       timestamptz not null default now(),
  created_by       uuid        references public.users(id),
  updated_at       timestamptz not null default now(),
  updated_by       uuid        references public.users(id),
  deleted_at       timestamptz,
  unique (container_id, event_name)
);

alter table public.conversion_events
  drop constraint if exists conversion_events_category_check;
alter table public.conversion_events
  add constraint conversion_events_category_check
  check (category in (
    'purchase',
    'add_to_cart',
    'begin_checkout',
    'subscribe',
    'qualified_lead',
    'converted_lead',
    'submit_lead_form',
    'book_appointment',
    'sign_up',
    'request_quote',
    'get_directions',
    'outbound_click',
    'contact',
    'page_view',
    'other'
  ));

-- Injection-fix constraints (20260827000000_fix_remaining_rls_gaps.sql) —
-- value_param/display_name are interpolated into copy-paste JS snippets
-- (src/features/conversions/lib/snippets.ts); the generator escapes them
-- defensively too, but this is the DB-level half of that defense-in-depth.
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

create index if not exists idx_conversion_events_container_deleted
  on public.conversion_events (container_id, deleted_at);

create or replace trigger set_updated_at
  before update on public.conversion_events
  for each row execute function public.set_updated_at();

alter table public.conversion_events enable row level security;

drop policy if exists "members can select conversion events" on public.conversion_events;
create policy "members can select conversion events"
  on public.conversion_events for select
  using (is_active_org_member(organisation_id));

-- INSERT policy already qualified against conversion_events.organisation_id
-- (not the bare, self-referential column) — this is the fixed shape from
-- 20260610000000_fix_domain_insert_rls.sql, not the original buggy one.
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
  );

drop policy if exists "editors can delete conversion events" on public.conversion_events;
create policy "editors can delete conversion events"
  on public.conversion_events for delete
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = conversion_events.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ============================================================
-- public.containers — manual Google Ads conversion ID (gtag/GTM snippet)
-- ============================================================

alter table public.containers
  add column if not exists google_ads_conversion_id text;

alter table public.containers
  drop constraint if exists containers_google_ads_conversion_id_check;

alter table public.containers
  add constraint containers_google_ads_conversion_id_check
  check (google_ads_conversion_id is null or google_ads_conversion_id ~ '^AW-[0-9]{6,}$');


-- ============================================================
-- public.live_verification_events
-- ============================================================
--
-- Real firing verification, as opposed to Preview mode's local simulation.
-- A business owner runs a short-lived snippet (LiveVerifyModal) in their
-- own browser console on their real site; it hooks window.dataLayer.push
-- and reports each pushed event back here via an anonymous,
-- unauthenticated insert — there's no Supabase session on a third-party
-- site, so the public anon key plus a random per-check token is the whole
-- access model, not auth.uid().

create table if not exists public.live_verification_events (
  id                   uuid        primary key default gen_random_uuid(),
  check_token          uuid        not null,
  conversion_event_id  uuid        not null references public.conversion_events(id) on delete cascade,
  organisation_id      uuid        not null references public.organisations(id)     on delete cascade,
  event_name           text,
  event_payload        jsonb       not null,
  captured_at          timestamptz not null default now(),
  check (octet_length(event_payload::text) <= 4000)
);

create index if not exists live_verification_events_check_token_idx
  on public.live_verification_events (check_token);

create index if not exists live_verification_events_event_captured_idx
  on public.live_verification_events (conversion_event_id, captured_at);

alter table public.live_verification_events enable row level security;

-- SECURITY DEFINER wrapper (same pattern as is_active_org_member): the
-- anonymous `anon` caller can't see conversion_events through that table's
-- own RLS, so the INSERT policy can't check it directly (that bug shipped
-- once already — 20260828020000_fix_live_verification_insert_rls.sql —
-- recreated here already fixed).
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

drop policy if exists "members can view their org's live checks" on public.live_verification_events;
create policy "members can view their org's live checks"
  on public.live_verification_events for select
  using (is_active_org_member(organisation_id));
