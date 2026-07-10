-- supabase/migrations/20260710000000_google_ads_conversion_tracking.sql
--
-- Adds Google Ads conversion tracking alongside the existing GA4 support.
--
-- - google_ads_conversion_id lives on containers: it's account-level in
--   Google Ads (format AW-XXXXXXXXX) and shared by every conversion action
--   inside that account, mirroring the existing one-container-per-external-
--   account pattern used by gtm_container_id / ga4_property_id.
-- - conversion_label and category live on conversion_events: the label is
--   unique per conversion action, and category groups events the same way
--   the Google Ads UI does (support.google.com/google-ads/answer/9791434).
--
-- No new RLS policies: both tables are already scoped by organisation_id
-- via is_active_org_member(), which covers these new columns for free.


-- ── public.containers ────────────────────────────────────────

alter table public.containers
  add column if not exists google_ads_conversion_id text;

alter table public.containers
  drop constraint if exists containers_google_ads_conversion_id_check;

alter table public.containers
  add constraint containers_google_ads_conversion_id_check
  check (google_ads_conversion_id is null or google_ads_conversion_id ~ '^AW-[0-9]{6,}$');


-- ── public.conversion_events ─────────────────────────────────

alter table public.conversion_events
  add column if not exists conversion_label text;

alter table public.conversion_events
  add column if not exists category text not null default 'other';

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
