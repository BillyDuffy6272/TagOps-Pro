-- supabase/seed.sql
--
-- TagOps-Pro: Development / demo seed data
-- Source files: seed-data/01-users.json … seed-data/09-tag-trigger-links.json
--
-- Run in the Supabase SQL editor AFTER the migration has completed
-- without errors.  Safe to re-run — all INSERTs use ON CONFLICT guards.
--
-- ─────────────────────────────────────────────────────────────────────
-- UUID mapping  (display_id → hard-coded UUID)
--
-- Pattern: first hex char of first group = entity type
--   a = users             b = organisations     c = members
--   d = containers        e = tags              f = triggers
--   07 prefix = variables (two digits; hex only goes to 'f')
--   08 prefix = conversion_events
-- Last group = zero-padded record number.
-- ─────────────────────────────────────────────────────────────────────
-- USRID_AG_0001  (Alex G)              → a0000000-0000-0000-0000-000000000001
-- USRID_AG_0002  (Jordan T)            → a0000000-0000-0000-0000-000000000002
-- USRID_AG_0003  (Sam W)               → a0000000-0000-0000-0000-000000000003
-- ORGID_AG_0001  (Need Tracking)       → b0000000-0000-0000-0000-000000000001
-- MEMID_AG_0001  (Alex — owner)        → c0000000-0000-0000-0000-000000000001
-- MEMID_AG_0002  (Jordan — editor)     → c0000000-0000-0000-0000-000000000002
-- MEMID_AG_0003  (Sam — admin)         → c0000000-0000-0000-0000-000000000003
-- CNTID_AG_0001  (production)          → d0000000-0000-0000-0000-000000000001
-- CNTID_AG_0002  (staging)             → d0000000-0000-0000-0000-000000000002
-- TAGID_AG_0001  (GA4 Purchase Event)  → e0000000-0000-0000-0000-000000000001
-- TAGID_AG_0002  (GA4 Config)          → e0000000-0000-0000-0000-000000000002
-- TAGID_AG_0003  (Meta Pixel Base)     → e0000000-0000-0000-0000-000000000003
-- TAGID_AG_0004  (Lead Form Event)     → e0000000-0000-0000-0000-000000000004
-- TAGID_AG_0005  (GA4 Scroll Event)    → e0000000-0000-0000-0000-000000000005
-- TRGID_AG_0001  (Purchase complete)   → f0000000-0000-0000-0000-000000000001
-- TRGID_AG_0002  (All Pages)           → f0000000-0000-0000-0000-000000000002
-- TRGID_AG_0003  (CTA Button Click)    → f0000000-0000-0000-0000-000000000003
-- TRGID_AG_0004  (Lead Form Submit)    → f0000000-0000-0000-0000-000000000004
-- TRGID_AG_0005  (Scroll 50%)          → f0000000-0000-0000-0000-000000000005
-- VARID_AG_0001  (purchase_value)      → 07000000-0000-0000-0000-000000000001
-- VARID_AG_0002  (page_url)            → 07000000-0000-0000-0000-000000000002
-- VARID_AG_0003  (ga4_measurement_id)  → 07000000-0000-0000-0000-000000000003
-- VARID_AG_0004  (user_id_cookie)      → 07000000-0000-0000-0000-000000000004
-- CONID_AG_0001  (purchase)            → 08000000-0000-0000-0000-000000000001
-- CONID_AG_0002  (generate_lead)       → 08000000-0000-0000-0000-000000000002
-- CONID_AG_0003  (view_pricing)        → 08000000-0000-0000-0000-000000000003
-- ─────────────────────────────────────────────────────────────────────
--
-- Security notes
-- • encrypted_password = ''  — dev/demo rows only; no real login possible.
-- • email_confirmed_at = created_at  — seeds users as already verified.
-- • Never run this file against a production database with live traffic.

begin;


-- ─────────────────────────────────────────────────────────────────────
-- auth.users   (source: seed-data/01-users.json)
--
-- Must be first: public.users FKs to auth.users.id and the
-- handle_new_user() trigger fires here, inserting stub rows into
-- public.users with a sequence-generated placeholder display_id.
--
-- aud + role are NOT NULL columns in Supabase's auth schema with no
-- defaults; both must be included.
-- ─────────────────────────────────────────────────────────────────────
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  created_at,
  updated_at,
  email_confirmed_at,
  raw_user_meta_data
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'alex@need-tracking.com',
    '',
    '2026-05-13T04:00:00Z',
    '2026-05-13T04:00:00Z',
    '2026-05-13T04:00:00Z',
    '{"full_name": "Alex G", "avatar_url": "https://lh3.googleusercontent.com/a/example-avatar"}'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'jordan.t@example.com',
    '',
    '2026-05-13T05:10:00Z',
    '2026-05-13T05:10:00Z',
    '2026-05-13T05:10:00Z',
    '{"full_name": "Jordan T", "avatar_url": "https://lh3.googleusercontent.com/a/example-avatar-2"}'::jsonb
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.users   (source: seed-data/01-users.json)
--
-- handle_new_user() already inserted stub rows above with a
-- placeholder display_id ('USRID_XX_0001' etc.).  DO UPDATE ensures
-- the correct display_id, display_name, and avatar_url are set on
-- every run, even when the stub rows already exist.
-- ─────────────────────────────────────────────────────────────────────
insert into public.users (
  id,
  display_id,
  email,
  display_name,
  avatar_url,
  created_at
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'USRID_AG_0001',
    'alex@need-tracking.com',
    'Alex G',
    'https://lh3.googleusercontent.com/a/example-avatar',
    '2026-05-13T04:00:00Z'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'USRID_AG_0002',
    'jordan.t@example.com',
    'Jordan T',
    'https://lh3.googleusercontent.com/a/example-avatar-2',
    '2026-05-13T05:10:00Z'
  )
on conflict (id) do update set
  display_id   = excluded.display_id,
  email        = excluded.email,
  display_name = excluded.display_name,
  avatar_url   = excluded.avatar_url;


-- ─────────────────────────────────────────────────────────────────────
-- public.organisations   (source: seed-data/02-organisations.json)
--
-- Inserting here fires on_organisation_created → auto_owner_membership()
-- which writes the owner row to organisation_members with a
-- placeholder display_id and gen_random_uuid() primary key.
-- Step 4 (below) corrects both values.
-- ─────────────────────────────────────────────────────────────────────
insert into public.organisations (
  id,
  display_id,
  name,
  slug,
  owner_id,
  created_at
)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'ORGID_AG_0001',
    'Need Tracking',
    'need-tracking',
    'a0000000-0000-0000-0000-000000000001',
    '2026-05-13T04:00:00Z'
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.organisation_members   (source: seed-data/03-memberships.json)
--
-- MEMID_AG_0001 (owner row)
--   auto_owner_membership() already created this row with a random
--   UUID and placeholder display_id.  DO UPDATE on the
--   (organisation_id, user_id) unique constraint overwrites both with
--   the deterministic seed values.  Updating the primary key (id) is
--   safe here: no other table has a foreign key to
--   organisation_members.id.
--
-- MEMID_AG_0002 (editor row)
--   Clean insert — no trigger created this row.  DO NOTHING is safe.
-- ─────────────────────────────────────────────────────────────────────
insert into public.organisation_members (
  id,
  display_id,
  organisation_id,
  user_id,
  role,
  joined_at
)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    'MEMID_AG_0001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'owner',
    '2026-05-13T04:00:00Z'
  )
on conflict (organisation_id, user_id) do update set
  id         = excluded.id,
  display_id = excluded.display_id,
  role       = excluded.role,
  joined_at  = excluded.joined_at;

insert into public.organisation_members (
  id,
  display_id,
  organisation_id,
  user_id,
  role,
  joined_at,
  expires_at
)
values
  (
    'c0000000-0000-0000-0000-000000000002',
    'MEMID_AG_0002',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'editor',
    '2026-05-13T05:12:00Z',
    '2026-08-11T05:12:00Z'
  )
on conflict (organisation_id, user_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.containers   (source: seed-data/04-containers.json)
-- ─────────────────────────────────────────────────────────────────────
insert into public.containers (
  id,
  display_id,
  organisation_id,
  name,
  domain,
  environment,
  gtm_container_id
)
values
  (
    'd0000000-0000-0000-0000-000000000001',
    'CNTID_AG_0001',
    'b0000000-0000-0000-0000-000000000001',
    'Main marketing site',
    'need-tracking.com',
    'production',
    'GTM-AB12CD3'
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.tags   (source: seed-data/05-tags.json)
--
-- organisation_id is absent from the JSON (it only references the
-- container by display_id).  It is derived here from the known
-- container → CNTID_AG_0001 belongs to ORGID_AG_0001.
-- ─────────────────────────────────────────────────────────────────────
insert into public.tags (
  id,
  display_id,
  container_id,
  organisation_id,
  name,
  tag_type,
  status,
  parameters,
  notes
)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    'TAGID_AG_0001',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'GA4 Purchase Event',
    'ga4_event',
    'active',
    '{"measurement_id": "G-XXXXXXX", "event_name": "purchase", "value": "{{purchase_value}}", "currency": "AUD"}'::jsonb,
    'Fires after the Stripe webhook confirms the order. Value pulled from the datalayer at the thank-you page.'
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.triggers   (source: seed-data/06-triggers.json)
--
-- organisation_id derived from container CNTID_AG_0001 → ORGID_AG_0001.
-- ─────────────────────────────────────────────────────────────────────
insert into public.triggers (
  id,
  display_id,
  container_id,
  organisation_id,
  name,
  trigger_type,
  event_name,
  conditions
)
values
  (
    'f0000000-0000-0000-0000-000000000001',
    'TRGID_AG_0001',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Purchase complete',
    'custom_event',
    'purchase',
    '[{"var": "page_path", "op": "contains", "val": "/checkout/thank-you"}]'::jsonb
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.variables   (source: seed-data/07-variables.json)
--
-- organisation_id derived from container CNTID_AG_0001 → ORGID_AG_0001.
-- ─────────────────────────────────────────────────────────────────────
insert into public.variables (
  id,
  display_id,
  container_id,
  organisation_id,
  name,
  variable_type,
  default_value
)
values
  (
    '07000000-0000-0000-0000-000000000001',
    'VARID_AG_0001',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'purchase_value',
    'datalayer',
    '0'
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.conversion_events   (source: seed-data/08-conversion-events.json)
--
-- organisation_id derived from container CNTID_AG_0001 → ORGID_AG_0001.
-- ─────────────────────────────────────────────────────────────────────
insert into public.conversion_events (
  id,
  display_id,
  container_id,
  organisation_id,
  event_name,
  value_param,
  currency,
  is_active
)
values
  (
    '08000000-0000-0000-0000-000000000001',
    'CONID_AG_0001',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'purchase',
    'purchase_value',
    'AUD',
    true
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- public.tag_triggers   (source: seed-data/09-tag-trigger-links.json)
--
-- Composite PK (tag_id, trigger_id, relationship) — no surrogate key.
-- ─────────────────────────────────────────────────────────────────────
insert into public.tag_triggers (
  tag_id,
  trigger_id,
  relationship
)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'fires_on'
  )
on conflict (tag_id, trigger_id, relationship) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- EXTENDED SEED DATA
-- Run this section (or the whole file) after the initial rows above.
-- All INSERTs are guarded with ON CONFLICT so re-runs are safe.
-- ─────────────────────────────────────────────────────────────────────

-- ── Extra user: Sam W (admin)  (source: extended seed) ───────────────
insert into auth.users (
  id, aud, role, email, encrypted_password,
  created_at, updated_at, email_confirmed_at, raw_user_meta_data
)
values (
  'a0000000-0000-0000-0000-000000000003',
  'authenticated', 'authenticated',
  'sam.w@example.com', '',
  '2026-05-20T09:00:00Z', '2026-05-20T09:00:00Z', '2026-05-20T09:00:00Z',
  '{"full_name": "Sam W", "avatar_url": "https://lh3.googleusercontent.com/a/example-avatar-3"}'::jsonb
)
on conflict (id) do nothing;

insert into public.users (id, display_id, email, display_name, avatar_url, created_at)
values (
  'a0000000-0000-0000-0000-000000000003',
  'USRID_AG_0003',
  'sam.w@example.com',
  'Sam W',
  'https://lh3.googleusercontent.com/a/example-avatar-3',
  '2026-05-20T09:00:00Z'
)
on conflict (id) do update set
  display_id   = excluded.display_id,
  email        = excluded.email,
  display_name = excluded.display_name,
  avatar_url   = excluded.avatar_url;

-- ── MEMID_AG_0003: Sam W — admin, no expiry ──────────────────────────
insert into public.organisation_members (
  id, display_id, organisation_id, user_id, role, joined_at
)
values (
  'c0000000-0000-0000-0000-000000000003',
  'MEMID_AG_0003',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'admin',
  '2026-05-20T09:05:00Z'
)
on conflict (organisation_id, user_id) do nothing;

-- ── CNTID_AG_0002: staging container ─────────────────────────────────
insert into public.containers (
  id, display_id, organisation_id, name, domain,
  environment, gtm_container_id, created_by
)
values (
  'd0000000-0000-0000-0000-000000000002',
  'CNTID_AG_0002',
  'b0000000-0000-0000-0000-000000000001',
  'Main marketing site (staging)',
  'staging.need-tracking.com',
  'staging',
  'GTM-CD34EF5',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- ── Tags on production container (CNTID_AG_0001) ─────────────────────

-- TAGID_AG_0002: GA4 Config — fires on every page
insert into public.tags (
  id, display_id, container_id, organisation_id,
  name, tag_type, status, parameters, created_by
)
values (
  'e0000000-0000-0000-0000-000000000002',
  'TAGID_AG_0002',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'GA4 Config',
  'ga4_config',
  'active',
  '{"measurement_id": "G-XXXXXXX"}'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- TAGID_AG_0003: Meta Pixel Base Code
insert into public.tags (
  id, display_id, container_id, organisation_id,
  name, tag_type, status, parameters, notes, created_by
)
values (
  'e0000000-0000-0000-0000-000000000003',
  'TAGID_AG_0003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Meta Pixel Base Code',
  'meta_pixel',
  'active',
  '{"pixel_id": "123456789012345"}'::jsonb,
  'Initialises the Meta pixel on all pages. Must fire before any Meta event tags.',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- TAGID_AG_0004: Lead Form Event
insert into public.tags (
  id, display_id, container_id, organisation_id,
  name, tag_type, status, parameters, notes, created_by
)
values (
  'e0000000-0000-0000-0000-000000000004',
  'TAGID_AG_0004',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'GA4 Lead Form Event',
  'ga4_event',
  'active',
  '{"measurement_id": "G-XXXXXXX", "event_name": "generate_lead", "source": "contact_form"}'::jsonb,
  'Fires when the contact form is submitted successfully.',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- TAGID_AG_0005: GA4 Scroll Event (draft — not yet live)
insert into public.tags (
  id, display_id, container_id, organisation_id,
  name, tag_type, status, parameters, created_by
)
values (
  'e0000000-0000-0000-0000-000000000005',
  'TAGID_AG_0005',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'GA4 Scroll Depth Event',
  'ga4_event',
  'draft',
  '{"measurement_id": "G-XXXXXXX", "event_name": "scroll", "percent_scrolled": "{{scroll_depth}}"}'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- ── Triggers on production container (CNTID_AG_0001) ─────────────────

-- TRGID_AG_0002: All Pages — fires on every pageview
insert into public.triggers (
  id, display_id, container_id, organisation_id,
  name, trigger_type, conditions, created_by
)
values (
  'f0000000-0000-0000-0000-000000000002',
  'TRGID_AG_0002',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'All Pages',
  'pageview',
  '[]'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- TRGID_AG_0003: CTA Button Click
insert into public.triggers (
  id, display_id, container_id, organisation_id,
  name, trigger_type, conditions, notes, created_by
)
values (
  'f0000000-0000-0000-0000-000000000003',
  'TRGID_AG_0003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'CTA Button Click',
  'click',
  '[{"var": "click_text", "op": "contains", "val": "Get Started"}]'::jsonb,
  'Matches any button whose visible text contains "Get Started".',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- TRGID_AG_0004: Lead Form Submit
insert into public.triggers (
  id, display_id, container_id, organisation_id,
  name, trigger_type, conditions, created_by
)
values (
  'f0000000-0000-0000-0000-000000000004',
  'TRGID_AG_0004',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Lead Form Submit',
  'form_submit',
  '[{"var": "form_id", "op": "equals", "val": "contact-form"}]'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- TRGID_AG_0005: Scroll 50%
insert into public.triggers (
  id, display_id, container_id, organisation_id,
  name, trigger_type, conditions, created_by
)
values (
  'f0000000-0000-0000-0000-000000000005',
  'TRGID_AG_0005',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Scroll 50 Percent',
  'scroll',
  '[{"var": "scroll_depth_threshold", "op": "greater_than", "val": "50"}]'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- ── Variables on production container (CNTID_AG_0001) ────────────────

-- VARID_AG_0002: page_url — current page URL
insert into public.variables (
  id, display_id, container_id, organisation_id,
  name, variable_type, parameters, created_by
)
values (
  '07000000-0000-0000-0000-000000000002',
  'VARID_AG_0002',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'page_url',
  'url',
  '{}'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- VARID_AG_0003: ga4_measurement_id — constant holding the property ID
insert into public.variables (
  id, display_id, container_id, organisation_id,
  name, variable_type, parameters, default_value, created_by
)
values (
  '07000000-0000-0000-0000-000000000003',
  'VARID_AG_0003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'ga4_measurement_id',
  'constant',
  '{}'::jsonb,
  'G-XXXXXXX',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- VARID_AG_0004: user_id_cookie — first-party cookie for user identification
insert into public.variables (
  id, display_id, container_id, organisation_id,
  name, variable_type, parameters, notes, created_by
)
values (
  '07000000-0000-0000-0000-000000000004',
  'VARID_AG_0004',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'user_id_cookie',
  'cookie',
  '{"cookie_name": "_uid"}'::jsonb,
  'Set by the app on login. Used to stitch sessions in GA4 via user_id parameter.',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- ── Conversion events on production container (CNTID_AG_0001) ────────

-- CONID_AG_0002: generate_lead
insert into public.conversion_events (
  id, display_id, container_id, organisation_id,
  event_name, display_name, is_active, created_by
)
values (
  '08000000-0000-0000-0000-000000000002',
  'CONID_AG_0002',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'generate_lead',
  'Lead Form Submission',
  true,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- CONID_AG_0003: view_pricing
insert into public.conversion_events (
  id, display_id, container_id, organisation_id,
  event_name, display_name, is_active, created_by
)
values (
  '08000000-0000-0000-0000-000000000003',
  'CONID_AG_0003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'view_pricing',
  'Pricing Page View',
  true,
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- ── Tag-trigger links (extended) ──────────────────────────────────────

-- GA4 Config fires on All Pages
insert into public.tag_triggers (tag_id, trigger_id, relationship)
values ('e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'fires_on')
on conflict (tag_id, trigger_id, relationship) do nothing;

-- Meta Pixel fires on All Pages
insert into public.tag_triggers (tag_id, trigger_id, relationship)
values ('e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 'fires_on')
on conflict (tag_id, trigger_id, relationship) do nothing;

-- Lead Form Event fires on Lead Form Submit
insert into public.tag_triggers (tag_id, trigger_id, relationship)
values ('e0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'fires_on')
on conflict (tag_id, trigger_id, relationship) do nothing;

-- GA4 Scroll Event fires on Scroll 50%
insert into public.tag_triggers (tag_id, trigger_id, relationship)
values ('e0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'fires_on')
on conflict (tag_id, trigger_id, relationship) do nothing;


-- ─────────────────────────────────────────────────────────────────────
-- Real-account access grant (development / demo only)
--
-- Every row above uses fake, hard-coded auth.users ids that have no
-- relationship to a real Supabase Auth identity. Signing in for real
-- (e.g. via Google OAuth) creates a genuine auth.users row with an id
-- Supabase generates at signup time — one we can't know in advance, so
-- it can't be hard-coded like the rows above.
--
-- This grants the real developer account owner access to the seeded
-- "Need Tracking" organisation (ORGID_AG_0001) by matching on email
-- instead, so the seeded containers/tags/triggers are visible after a
-- real sign-in. Safe to re-run; a no-op once the row exists.
-- ─────────────────────────────────────────────────────────────────────
insert into public.organisation_members (
  display_id,
  organisation_id,
  user_id,
  role,
  joined_at
)
select
  'MEMID_XX_' || lpad(nextval('public.member_display_id_seq')::text, 4, '0'),
  'b0000000-0000-0000-0000-000000000001',
  u.id,
  'owner',
  now()
from auth.users u
where u.email = 'alxgellert@gmail.com'
on conflict (organisation_id, user_id) do nothing;


commit;
