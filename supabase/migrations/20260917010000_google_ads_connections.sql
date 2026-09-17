-- supabase/migrations/20260917010000_google_ads_connections.sql
--
-- New for ADR-0039: a real, per-organisation Google Ads OAuth connection,
-- separate from the manual google_ads_conversion_id snippet field added
-- back in 20260917000000_readd_conversion_tracking.sql. The refresh token
-- this stores is exactly the kind of sensitive data the Security Floor's
-- item 6 is about, so it never sits in a plain client-readable column:
--   - the token itself lives in Supabase Vault (pgsodium-encrypted at
--     rest), referenced here only by its vault.secrets id;
--   - this table has RLS enabled with NO policies granted to anon/
--     authenticated at all, so it is completely invisible from the
--     client regardless of org membership;
--   - the only way in or out is through the two SECURITY DEFINER
--     functions below, and only the service_role (used exclusively by
--     the google-ads-connect / google-ads-report Edge Functions, never
--     shipped client-side — Security Floor item 3) may execute them.
--
-- A third function, get_google_ads_connection_status(), is safe for any
-- active org member to call directly — it never returns the token.

create table if not exists public.google_ads_connections (
  organisation_id  uuid        primary key references public.organisations(id) on delete cascade,
  customer_id      text        not null check (customer_id ~ '^[0-9]{10}$'),
  vault_secret_id  uuid        not null,
  connected_by     uuid        references public.users(id),
  connected_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace trigger set_updated_at
  before update on public.google_ads_connections
  for each row execute function public.set_updated_at();

alter table public.google_ads_connections enable row level security;
-- Deliberately no policies: default-deny for anon/authenticated. Only
-- service_role (which bypasses RLS) and the SECURITY DEFINER functions
-- below can ever touch this table.


-- ── Write: store or replace a connection's refresh token ────────────
-- service_role only — called by supabase/functions/google-ads-connect
-- right after the caller's own JWT has been checked for active org
-- membership in the Edge Function itself.
create or replace function public.store_google_ads_refresh_token(
  p_org_id uuid,
  p_refresh_token text,
  p_customer_id text,
  p_connected_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_secret_id uuid;
  v_new_secret_id uuid;
begin
  select vault_secret_id into v_existing_secret_id
  from public.google_ads_connections
  where organisation_id = p_org_id;

  if v_existing_secret_id is not null then
    perform vault.update_secret(v_existing_secret_id, p_refresh_token);
    update public.google_ads_connections
    set customer_id  = p_customer_id,
        connected_by = p_connected_by,
        connected_at = now()
    where organisation_id = p_org_id;
  else
    v_new_secret_id := vault.create_secret(
      p_refresh_token,
      'google_ads_refresh_token:' || p_org_id::text,
      'Google Ads OAuth refresh token for organisation ' || p_org_id::text
    );
    insert into public.google_ads_connections (organisation_id, customer_id, vault_secret_id, connected_by)
    values (p_org_id, p_customer_id, v_new_secret_id, p_connected_by);
  end if;
end;
$$;

-- Supabase's own default privileges grant EXECUTE on every new function in
-- the public schema directly to anon AND authenticated (not just PUBLIC —
-- confirmed via pg_default_acl), so `revoke ... from public` alone is a
-- no-op here and would leave this callable by any signed-in user. Both
-- roles must be revoked explicitly.
revoke execute on function public.store_google_ads_refresh_token(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.store_google_ads_refresh_token(uuid, text, text, uuid) to service_role;


-- ── Read: fetch the raw refresh token ────────────────────────────────
-- service_role only — called by supabase/functions/google-ads-report to
-- mint a fresh Google access token before calling the Ads API. Never
-- exposed to anon/authenticated; the token itself must never reach the
-- client (Security Floor item 3's principle applied to this secret too).
create or replace function public.get_google_ads_refresh_token(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select vs.decrypted_secret
  from public.google_ads_connections gac
  join vault.decrypted_secrets vs on vs.id = gac.vault_secret_id
  where gac.organisation_id = p_org_id;
$$;

revoke execute on function public.get_google_ads_refresh_token(uuid) from public, anon, authenticated;
grant execute on function public.get_google_ads_refresh_token(uuid) to service_role;


-- ── Read: connection status only — never the token ──────────────────
-- Safe for any active org member to call directly from the client via
-- .rpc(); used to render "Connected ✓ / Not connected" in the UI.
create or replace function public.get_google_ads_connection_status(p_org_id uuid)
returns table (connected boolean, customer_id text, connected_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_active_org_member(p_org_id) then
    raise exception 'not an active member of this organisation';
  end if;

  return query
  select true, gac.customer_id, gac.connected_at
  from public.google_ads_connections gac
  where gac.organisation_id = p_org_id;

  if not found then
    return query select false, null::text, null::timestamptz;
  end if;
end;
$$;

-- anon revoked too (it's auto-granted by the same default-privilege rule):
-- an anonymous caller would fail is_active_org_member()'s auth.uid() check
-- anyway (raises rather than leaking anything), but there's no reason to
-- let anon reach this function's logic at all.
revoke execute on function public.get_google_ads_connection_status(uuid) from public, anon;
grant execute on function public.get_google_ads_connection_status(uuid) to authenticated;
