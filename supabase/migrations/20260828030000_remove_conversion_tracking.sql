-- supabase/migrations/20260828030000_remove_conversion_tracking.sql
--
-- Removes conversion-event tracking entirely (decision-log.md ADR-0038).
-- The feature (document a conversion event, link a Google Ads conversion ID,
-- generate a paste-in tracking snippet, verify it fires live) was built
-- across 20260601000000_init_schema.sql, 20260610000000_fix_domain_insert_rls.sql,
-- 20260710000000_google_ads_conversion_tracking.sql, 20260827000000_fix_remaining_rls_gaps.sql,
-- 20260828010000_live_verification_events.sql, and 20260828020000_fix_live_verification_insert_rls.sql.
-- It's being descoped: real value depended on pulling live data from the
-- Google Ads API, which needs a developer token subject to Google's own
-- review — an external approval process with no guaranteed timeline, not
-- something safe to depend on this close to a fixed submission deadline.
--
-- containers/tags/triggers/variables are untouched — conversion_events was
-- the only child table of containers being removed here, not containers
-- itself, which tags/triggers/variables still depend on.

drop table if exists public.live_verification_events;
drop table if exists public.conversion_events;

drop function if exists public.conversion_event_belongs_to_org(uuid, uuid);

alter table public.containers
  drop constraint if exists containers_google_ads_conversion_id_check;

alter table public.containers
  drop column if exists google_ads_conversion_id;
