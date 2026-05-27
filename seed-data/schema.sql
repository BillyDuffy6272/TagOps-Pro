-- TagOps-Pro: Database Schema (draft)
--
-- Target:  Supabase Postgres (PostgreSQL 15+)
-- Source:  Derived from the data dictionary at docs/04-data-model.md
-- Status:  Week 2 draft. Tables + columns + basic CHECK constraints only.
--          RLS policies, audit triggers, indexes, and soft-delete
--          enforcement are added in Weeks 5-6 as proper Supabase migrations
--          under supabase/migrations/.
--
-- Conventions
--   - Internal primary keys are uuids (Supabase convention).
--   - Each row also carries a `display_id` text column that matches the
--     PREFIX_XX_YYYY format used in the JSON seed files.
--   - Column names are snake_case to match Postgres convention; JSON keys
--     in the seed files are CamelCase to match the data dictionary.
--   - `created_at` / `updated_at` are timestamptz with `default now()`.
--     `updated_at` will be maintained by a Postgres trigger added in
--     Weeks 5-6 (not included here).
--   - Soft delete (`deleted_at`) is included where the data dictionary
--     specifies it; application queries filter on `deleted_at is null`.

create extension if not exists "pgcrypto";


-- ============================================================
-- users
--   Mirrors auth.users with display info. A row is created by a trigger
--   on auth.users.insert (added in Weeks 5-6).
-- ============================================================
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


-- ============================================================
-- organisations
--   The tenant boundary. Every domain row references one organisation.
-- ============================================================
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


-- ============================================================
-- organisation_members
--   Many-to-many between users and organisations. Carries the
--   "expiry date for people" required by 02-requirements.md.
-- ============================================================
create table if not exists public.organisation_members (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^MEMID_[A-Z]{2}_[0-9]{4}$'),
  organisation_id  uuid        not null references public.organisations(id) on delete cascade,
  user_id          uuid        not null references public.users(id) on delete cascade,
  role             text        not null default 'editor'
                               check (role in ('owner','admin','editor','viewer')),
  invited_by       uuid        references public.users(id),
  joined_at        timestamptz not null default now(),
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organisation_id, user_id),
  check (expires_at is null or expires_at > joined_at),
  -- owners cannot expire
  check (role <> 'owner' or expires_at is null)
);


-- ============================================================
-- containers
--   Each Organisation owns one or more tracking containers. A container
--   represents a website/app being tracked.
-- ============================================================
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


-- ============================================================
-- tags
-- ============================================================
create table if not exists public.tags (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^TAGID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id) on delete cascade,
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


-- ============================================================
-- triggers
-- ============================================================
create table if not exists public.triggers (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^TRGID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id) on delete cascade,
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


-- ============================================================
-- variables
-- ============================================================
create table if not exists public.variables (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^VARID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id) on delete cascade,
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


-- ============================================================
-- conversion_events
-- ============================================================
create table if not exists public.conversion_events (
  id               uuid        primary key default gen_random_uuid(),
  display_id       text        not null unique
                               check (display_id ~ '^CONID_[A-Z]{2}_[0-9]{4}$'),
  container_id     uuid        not null references public.containers(id) on delete cascade,
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


-- ============================================================
-- tag_triggers
--   Many-to-many between tags and triggers. The `relationship` column
--   distinguishes firing triggers from blocking triggers.
-- ============================================================
create table if not exists public.tag_triggers (
  tag_id        uuid        not null references public.tags(id) on delete cascade,
  trigger_id    uuid        not null references public.triggers(id) on delete cascade,
  relationship  text        not null default 'fires_on'
                            check (relationship in ('fires_on','blocks')),
  created_at    timestamptz not null default now(),
  primary key (tag_id, trigger_id, relationship)
);


-- ============================================================
-- Notes / next steps (Weeks 5-6)
-- ============================================================
--   1. Convert this file into numbered migrations under
--      supabase/migrations/ (e.g., 0001_init.sql).
--   2. Add `updated_at` triggers on every table.
--   3. Add a Postgres trigger that auto-inserts an owner row in
--      organisation_members whenever an organisation row is created.
--   4. Enable RLS on every table and add policies based on the
--      is_active_org_member(uuid) helper described in
--      docs/04-data-model.md.
--   5. Add indexes on the hot RLS paths:
--        (organisation_id, user_id) WHERE expires_at IS NULL OR expires_at > now()
--      and on (container_id, deleted_at) for each domain table.
--   6. Decide on the audit-log table shape and add the corresponding
--      triggers.
