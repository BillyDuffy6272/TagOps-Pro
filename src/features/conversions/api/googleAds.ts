import { supabase, toError } from '../../../lib/supabase'

// New for ADR-0039 — a real Google Ads OAuth connection, on top of the
// restored local conversion-event tracking. See docs/decision-log.md
// ADR-0039 for why the report call below is expected to return
// `developer_token_not_configured` right now: no real Google Ads
// developer token exists, so supabase/functions/google-ads-report can't
// call the live Ads API yet. This file, the OAuth connect flow, and the
// Edge Functions it calls are genuinely unverified against a live Google
// Ads endpoint — everything up to (not including) that final call has
// been exercised for real.

export interface GoogleAdsConnectionStatus {
  connected: boolean
  customerId: string | null
  connectedAt: string | null
}

// Safe for any active org member — never returns the refresh token itself,
// only whether a connection exists (see get_google_ads_connection_status
// in supabase/migrations/20260917010000_google_ads_connections.sql).
export async function getGoogleAdsConnectionStatus(organisationId: string): Promise<GoogleAdsConnectionStatus> {
  const { data, error } = await supabase.rpc('get_google_ads_connection_status', { p_org_id: organisationId })
  if (error) throw toError(error)
  const row = data?.[0]
  return {
    connected: row?.connected ?? false,
    customerId: row?.customer_id ?? null,
    connectedAt: row?.connected_at ?? null,
  }
}

const CUSTOMER_ID_PATTERN = /^[0-9]{10}$/

export function isValidGoogleAdsCustomerId(value: string): boolean {
  return CUSTOMER_ID_PATTERN.test(value.replace(/-/g, ''))
}

// Persists the refresh token captured right after the "Connect Google Ads"
// OAuth redirect completes. The token itself never touches this file's
// caller for longer than it takes to make this one call — it's handed off
// to store_google_ads_refresh_token (service_role only, Supabase Vault)
// via this Edge Function, which is the first Edge Function in this repo.
export async function connectGoogleAds(
  organisationId: string,
  refreshToken: string,
  customerId: string
): Promise<void> {
  const digitsOnlyCustomerId = customerId.replace(/-/g, '')
  const { error } = await supabase.functions.invoke('google-ads-connect', {
    body: { organisationId, refreshToken, customerId: digitsOnlyCustomerId },
  })
  if (error) throw toError(error)
}

export interface GoogleAdsConversionActionStat {
  conversionActionName: string
  conversions: number
  conversionsValue: number
}

export type GoogleAdsReportResult =
  | { status: 'ok'; stats: GoogleAdsConversionActionStat[] }
  | { status: 'developer_token_not_configured' }

// Calls supabase/functions/google-ads-report. Expected, today, to come
// back as `developer_token_not_configured` — see the file header note.
export async function fetchGoogleAdsReport(organisationId: string): Promise<GoogleAdsReportResult> {
  const { data, error } = await supabase.functions.invoke<
    { status: 'ok'; stats: GoogleAdsConversionActionStat[] } | { status: 'developer_token_not_configured' }
  >('google-ads-report', { body: { organisationId } })
  if (error) throw toError(error)
  if (!data) throw new Error('No response from the Google Ads report function.')
  return data
}
