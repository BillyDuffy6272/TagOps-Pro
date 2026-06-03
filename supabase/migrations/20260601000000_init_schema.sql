-- supabase/migrations/20260601000000_init_schema.sql
--
-- TagOps-Pro: Full schema bootstrap
-- Safe to run on the live Supabase project that currently only has
-- public.profiles.  Drops the profiles artifacts first, then creates
-- all 9 domain tables, helper functions, triggers, RLS policies,
-- and performance indexes.
--
-- Run in the Supabase SQL editor.  After this succeeds, run seed.sql.


-- ============================================================
-- 1. TEARDOWN — remove conflicting profiles artifacts
-- ============================================================

drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table    if exists public.profiles cascade;


-- ============================================================
-- 2. EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- 3. TABLES — FK-safe order
--    users → organisations → organisation_members → containers
--    → tags → triggers → variables → conversion_events
--    → tag_triggers
-- ============================================================

-- ------------------------------------------------------------
-- public.users — mirrors auth.users with display info.
-- ------------------------------------------------------------
create table if not exists public.users (
  id            uuid        primary key,                  -- = auth.users.id
  display_id    text        not null unique
                            check (display_id ~ '^USRID_[A-Z]{2}_[0-9]{4}$'),
  email         text        not null unique,
  display_name  text        check (char_length(display_name) between 1 and 80),
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- public.organisations — tenant boundary.
-- ------------------------------------------------------------
create table if not exists public.organisations (
  id            uuid        primary key default gen_random_uuid(),
  display_id    text        not null unique
                            check (display_id ~ '^ORGID_[A-Z]{2}_[0-9]{4}$'),
  name          text        not null
                            check (char_length(name) between 1 and 100),
  slug          text        not null unique
                            check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$'),
  owner_id      uuid        not null references public.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- ------------------------------------------------------------
-- public.organisation_members — users ↔ orgs with role + expiry.
-- ------------------------------------------------------------
create table if not exists public.organisation_members (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^MEMID_[A-Z]{2}_[0-9]{4}$'),
  organisation_id  uuid        not null references public.organisations(id) on delete cascade,
  user_id          uuid        not null references public.users(id)          on delete cascade,
  role             text        not null default 'editor'
                               check (role in ('owner','admin','editor','viewer')),
  invited_by       uuid        references public.users(id),
  joined_at        timestamptz not null default now(),
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organisation_id, user_id),
  check (expires_at is null or expires_at > joined_at),
  check (role <> 'owner' or expires_at is null)      -- owners can never expire
);

-- ------------------------------------------------------------
-- public.containers
-- ------------------------------------------------------------
create table if not exists public.containers (
  id                uuid        primary key default gen_random_uuid(),
  display_id        text        not null unique
                                check (display_id ~ '^CNTID_[A-Z]{2}_[0-9]{4}$'),
  organisation_id   uuid        not null references public.organisations(id),
  name              text        not null
                                check (char_length(name) between 1 and 100),
  domain            text,
  environment       text        not null default 'production'
                                check (environment in ('production','staging','sandbox')),
  gtm_container_id  text,
  ga4_property_id   text,
  notes             text,
  created_at        timestamptz not null default now(),
  created_by        uuid        references public.users(id),
  updated_at        timestamptz not null default now(),
  updated_by        uuid        references public.users(id),
  deleted_at        timestamptz,
  unique (organisation_id, gtm_container_id)
);

-- ------------------------------------------------------------
-- public.tags
-- ------------------------------------------------------------
create table if not exists public.tags (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^TAGID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id)     on delete cascade,
  organisation_id  uuid        not null references public.organisations(id),
  name             text        not null
                               check (char_length(name) between 1 and 150),
  tag_type         text        not null
                               check (tag_type in ('ga4_event','ga4_config','meta_pixel','floodlight','custom_html')),
  status           text        not null default 'draft'
                               check (status in ('draft','active','paused','archived')),
  priority         int         not null default 0,
  parameters       jsonb       not null default '{}'::jsonb
                               check (jsonb_typeof(parameters) = 'object'),
  notes            text,
  created_at       timestamptz not null default now(),
  created_by       uuid        references public.users(id),
  updated_at       timestamptz not null default now(),
  updated_by       uuid        references public.users(id),
  deleted_at       timestamptz,
  unique (container_id, name)
);

-- ------------------------------------------------------------
-- public.triggers
-- ------------------------------------------------------------
create table if not exists public.triggers (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^TRGID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id)     on delete cascade,
  organisation_id  uuid        not null references public.organisations(id),
  name             text        not null
                               check (char_length(name) between 1 and 150),
  trigger_type     text        not null
                               check (trigger_type in ('pageview','click','custom_event','form_submit','scroll','timer','history_change')),
  event_name       text,
  conditions       jsonb       not null default '[]'::jsonb
                               check (jsonb_typeof(conditions) = 'array'),
  notes            text,
  created_at       timestamptz not null default now(),
  created_by       uuid        references public.users(id),
  updated_at       timestamptz not null default now(),
  updated_by       uuid        references public.users(id),
  deleted_at       timestamptz,
  unique (container_id, name)
);

-- ------------------------------------------------------------
-- public.variables
-- ------------------------------------------------------------
create table if not exists public.variables (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^VARID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id)     on delete cascade,
  organisation_id  uuid        not null references public.organisations(id),
  name             text        not null
                               check (name ~ '^[A-Za-z_][A-Za-z0-9_]*$'),
  variable_type    text        not null
                               check (variable_type in ('datalayer','constant','url','cookie','dom_element','custom_js')),
  parameters       jsonb       not null default '{}'::jsonb,
  default_value    text,
  notes            text,
  created_at       timestamptz not null default now(),
  created_by       uuid        references public.users(id),
  updated_at       timestamptz not null default now(),
  updated_by       uuid        references public.users(id),
  deleted_at       timestamptz,
  unique (container_id, name)
);

-- ------------------------------------------------------------
-- public.conversion_events
-- ------------------------------------------------------------
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
  is_active        boolean     not null default true,
  notes            text,
  created_at       timestamptz not null default now(),
  created_by       uuid        references public.users(id),
  updated_at       timestamptz not null default now(),
  updated_by       uuid        references public.users(id),
  deleted_at       timestamptz,
  unique (container_id, event_name)
);

-- ------------------------------------------------------------
-- public.tag_triggers — firing / blocking junction.
-- No organisation_id column; org is derived via the parent tag.
-- No updated_at; rows are replaced (delete + insert), not patched.
-- ------------------------------------------------------------
create table if not exists public.tag_triggers (
  tag_id        uuid        not null references public.tags(id)     on delete cascade,
  trigger_id    uuid        not null references public.triggers(id) on delete cascade,
  relationship  text        not null default 'fires_on'
                            check (relationship in ('fires_on','blocks')),
  created_at    timestamptz not null default now(),
  primary key (tag_id, trigger_id, relationship)
);


-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- ------------------------------------------------------------
-- 4a. Sequences for trigger-generated display_id placeholders.
--
-- handle_new_user() and auto_owner_membership() run before the
-- app knows the org two-letter code, so they need a valid,
-- unique placeholder that satisfies the NOT NULL + UNIQUE +
-- CHECK constraints on display_id.  Sequences provide that.
-- The app updates display_id to the real USRID_XX_NNNN /
-- MEMID_XX_NNNN value during onboarding.
-- ------------------------------------------------------------
create sequence if not exists public.user_display_id_seq   start 1 increment 1;
create sequence if not exists public.member_display_id_seq start 1 increment 1;

-- ------------------------------------------------------------
-- 4b. set_updated_at() — keep updated_at columns current.
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 4c. is_active_org_member(org_id uuid) RETURNS boolean
--
-- Returns true when auth.uid() has a non-expired row in
-- organisation_members for the given org.  This is the core
-- RLS building block used by every SELECT policy on domain
-- tables.
--
-- SECURITY DEFINER: required to break the circular dependency —
-- the SELECT policy on organisation_members itself calls this
-- function, which must read organisation_members.  Without
-- SECURITY DEFINER the function would need to pass its own RLS
-- policy, causing infinite recursion.
--
-- SET search_path = '' prevents search-path injection; all
-- table references inside must be fully qualified.
-- ------------------------------------------------------------
create or replace function public.is_active_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from   public.organisation_members om
    where  om.organisation_id = org_id
      and  om.user_id         = auth.uid()
      and  (om.expires_at is null or om.expires_at > now())
  );
$$;

-- ------------------------------------------------------------
-- 4d. handle_new_user() — mirrors new auth.users into public.users.
--
-- SECURITY DEFINER: the trigger fires in the auth service context
-- before any JWT exists; running as the function owner (postgres)
-- gives it write access to public.users regardless of RLS.
--
-- display_id is set to a unique placeholder 'USRID_XX_NNNN' via
-- a sequence.  The app replaces this with the real org-specific
-- code during first-time onboarding.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, display_id, email, display_name, avatar_url)
  values (
    new.id,
    'USRID_XX_' || lpad(nextval('public.user_display_id_seq')::text, 4, '0'),
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 4e. auto_owner_membership() — inserts the creator as org owner.
--
-- Fires AFTER INSERT ON public.organisations.  Immediately adds
-- the org's owner_id into organisation_members (role='owner',
-- expires_at=NULL) so that RLS SELECT policies work instantly
-- after the org row is visible.
--
-- SECURITY DEFINER: the caller is not yet a member of the
-- brand-new org, so the INSERT policy on organisation_members
-- would block a non-privileged write.
--
-- display_id is set to a unique placeholder 'MEMID_XX_NNNN'.
-- The seed file and the app both update it to the real value.
-- ------------------------------------------------------------
create or replace function public.auto_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organisation_members (
    display_id,
    organisation_id,
    user_id,
    role,
    joined_at,
    expires_at
  )
  values (
    'MEMID_XX_' || lpad(nextval('public.member_display_id_seq')::text, 4, '0'),
    new.id,
    new.owner_id,
    'owner',
    now(),
    null
  )
  on conflict (organisation_id, user_id) do nothing;
  return new;
end;
$$;


-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- auth.users INSERT → mirror into public.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- public.organisations INSERT → add owner membership row
create or replace trigger on_organisation_created
  after insert on public.organisations
  for each row execute function public.auto_owner_membership();

-- updated_at maintenance on every table that carries the column.
-- (tag_triggers has no updated_at column — intentionally excluded.)
create or replace trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.organisation_members
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.containers
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.triggers
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.variables
  for each row execute function public.set_updated_at();

create or replace trigger set_updated_at
  before update on public.conversion_events
  for each row execute function public.set_updated_at();


-- ============================================================
-- 6. RLS — enable on every table, then add policies
-- ============================================================

alter table public.users                enable row level security;
alter table public.organisations        enable row level security;
alter table public.organisation_members enable row level security;
alter table public.containers           enable row level security;
alter table public.tags                 enable row level security;
alter table public.triggers             enable row level security;
alter table public.variables            enable row level security;
alter table public.conversion_events    enable row level security;
alter table public.tag_triggers         enable row level security;


-- ── public.users ─────────────────────────────────────────────

drop policy if exists "users can select own row"    on public.users;
-- A user can only read their own profile row.
create policy "users can select own row"
  on public.users for select
  using (auth.uid() = id);

-- No INSERT or UPDATE policy: handle_new_user() (SECURITY DEFINER)
-- handles the only legitimate insert path.  RLS blocks all others.


-- ── public.organisations ─────────────────────────────────────

drop policy if exists "members can select organisations"  on public.organisations;
-- Any active (non-expired) member can read their org.
create policy "members can select organisations"
  on public.organisations for select
  using (is_active_org_member(id));

drop policy if exists "authenticated users can create organisations" on public.organisations;
-- Any authenticated user can create a new organisation.
create policy "authenticated users can create organisations"
  on public.organisations for insert
  with check (auth.uid() is not null);

drop policy if exists "owners can update organisations" on public.organisations;
-- Only the org owner can update the organisation record.
create policy "owners can update organisations"
  on public.organisations for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = id
        and  user_id         = auth.uid()
        and  role            = 'owner'
    )
  );

drop policy if exists "owners can delete organisations" on public.organisations;
-- Only the org owner can delete the organisation.
create policy "owners can delete organisations"
  on public.organisations for delete
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = id
        and  user_id         = auth.uid()
        and  role            = 'owner'
    )
  );


-- ── public.organisation_members ──────────────────────────────

drop policy if exists "members can select organisation members" on public.organisation_members;
-- Any active member can see the full membership list for their org.
create policy "members can select organisation members"
  on public.organisation_members for select
  using (is_active_org_member(organisation_id));

drop policy if exists "admins can insert organisation members" on public.organisation_members;
-- Only owners and admins can add new members.
create policy "admins can insert organisation members"
  on public.organisation_members for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = organisation_members.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin')
    )
  );

drop policy if exists "admins can update organisation members" on public.organisation_members;
-- Only owners and admins can change membership records.
create policy "admins can update organisation members"
  on public.organisation_members for update
  using (
    exists (
      select 1 from public.organisation_members om
      where  om.organisation_id = organisation_members.organisation_id
        and  om.user_id         = auth.uid()
        and  om.role            in ('owner', 'admin')
    )
  );

drop policy if exists "admins can delete organisation members" on public.organisation_members;
-- Only owners and admins can remove members.
create policy "admins can delete organisation members"
  on public.organisation_members for delete
  using (
    exists (
      select 1 from public.organisation_members om
      where  om.organisation_id = organisation_members.organisation_id
        and  om.user_id         = auth.uid()
        and  om.role            in ('owner', 'admin')
    )
  );


-- ── public.containers ────────────────────────────────────────

drop policy if exists "members can select containers" on public.containers;
create policy "members can select containers"
  on public.containers for select
  using (is_active_org_member(organisation_id));

drop policy if exists "editors can insert containers" on public.containers;
create policy "editors can insert containers"
  on public.containers for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can update containers" on public.containers;
create policy "editors can update containers"
  on public.containers for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = containers.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can delete containers" on public.containers;
create policy "editors can delete containers"
  on public.containers for delete
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = containers.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.tags ──────────────────────────────────────────────

drop policy if exists "members can select tags" on public.tags;
create policy "members can select tags"
  on public.tags for select
  using (is_active_org_member(organisation_id));

drop policy if exists "editors can insert tags" on public.tags;
create policy "editors can insert tags"
  on public.tags for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can update tags" on public.tags;
create policy "editors can update tags"
  on public.tags for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = tags.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can delete tags" on public.tags;
create policy "editors can delete tags"
  on public.tags for delete
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = tags.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.triggers ──────────────────────────────────────────

drop policy if exists "members can select triggers" on public.triggers;
create policy "members can select triggers"
  on public.triggers for select
  using (is_active_org_member(organisation_id));

drop policy if exists "editors can insert triggers" on public.triggers;
create policy "editors can insert triggers"
  on public.triggers for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can update triggers" on public.triggers;
create policy "editors can update triggers"
  on public.triggers for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = triggers.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can delete triggers" on public.triggers;
create policy "editors can delete triggers"
  on public.triggers for delete
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = triggers.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.variables ─────────────────────────────────────────

drop policy if exists "members can select variables" on public.variables;
create policy "members can select variables"
  on public.variables for select
  using (is_active_org_member(organisation_id));

drop policy if exists "editors can insert variables" on public.variables;
create policy "editors can insert variables"
  on public.variables for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can update variables" on public.variables;
create policy "editors can update variables"
  on public.variables for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = variables.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "editors can delete variables" on public.variables;
create policy "editors can delete variables"
  on public.variables for delete
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = variables.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin', 'editor')
        and  (expires_at is null or expires_at > now())
    )
  );


-- ── public.conversion_events ─────────────────────────────────

drop policy if exists "members can select conversion events" on public.conversion_events;
create policy "members can select conversion events"
  on public.conversion_events for select
  using (is_active_org_member(organisation_id));

drop policy if exists "editors can insert conversion events" on public.conversion_events;
create policy "editors can insert conversion events"
  on public.conversion_events for insert
  with check (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = organisation_id
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


-- ── public.tag_triggers ──────────────────────────────────────
--
-- tag_triggers has no organisation_id column; the org is
-- derived through the parent tag row in all policies below.

drop policy if exists "members can select tag triggers" on public.tag_triggers;
-- Member can read a link if they belong to the tag's org.
create policy "members can select tag triggers"
  on public.tag_triggers for select
  using (
    is_active_org_member(
      (select t.organisation_id from public.tags t where t.id = tag_triggers.tag_id)
    )
  );

drop policy if exists "editors can insert tag triggers" on public.tag_triggers;
-- Editors and above can create tag-trigger links within their org.
create policy "editors can insert tag triggers"
  on public.tag_triggers for insert
  with check (
    exists (
      select 1
      from   public.tags                 t
      join   public.organisation_members om on om.organisation_id = t.organisation_id
      where  t.id        = tag_id
        and  om.user_id  = auth.uid()
        and  om.role     in ('owner', 'admin', 'editor')
        and  (om.expires_at is null or om.expires_at > now())
    )
  );

drop policy if exists "editors can update tag triggers" on public.tag_triggers;
-- Editors and above can update tag-trigger links within their org.
create policy "editors can update tag triggers"
  on public.tag_triggers for update
  using (
    exists (
      select 1
      from   public.tags                 t
      join   public.organisation_members om on om.organisation_id = t.organisation_id
      where  t.id        = tag_triggers.tag_id
        and  om.user_id  = auth.uid()
        and  om.role     in ('owner', 'admin', 'editor')
        and  (om.expires_at is null or om.expires_at > now())
    )
  );

drop policy if exists "editors can delete tag triggers" on public.tag_triggers;
-- Editors and above can remove tag-trigger links within their org.
create policy "editors can delete tag triggers"
  on public.tag_triggers for delete
  using (
    exists (
      select 1
      from   public.tags                 t
      join   public.organisation_members om on om.organisation_id = t.organisation_id
      where  t.id        = tag_triggers.tag_id
        and  om.user_id  = auth.uid()
        and  om.role     in ('owner', 'admin', 'editor')
        and  (om.expires_at is null or om.expires_at > now())
    )
  );


-- ============================================================
-- 7. INDEXES on hot RLS lookup paths
-- ============================================================

-- Covers (org, user) pair used in every editor/admin EXISTS check
-- and the unique membership constraint.
create index if not exists idx_org_members_org_user
  on public.organisation_members (organisation_id, user_id);

-- Covers is_active_org_member(): lookup by (user_id, expires_at).
create index if not exists idx_org_members_user_expires
  on public.organisation_members (user_id, expires_at);

-- Covers soft-delete filtered list queries per org.
create index if not exists idx_containers_org_deleted
  on public.containers (organisation_id, deleted_at);

-- Covers soft-delete filtered list queries per container.
create index if not exists idx_tags_container_deleted
  on public.tags (container_id, deleted_at);

create index if not exists idx_triggers_container_deleted
  on public.triggers (container_id, deleted_at);

create index if not exists idx_variables_container_deleted
  on public.variables (container_id, deleted_at);

create index if not exists idx_conversion_events_container_deleted
  on public.conversion_events (container_id, deleted_at);
