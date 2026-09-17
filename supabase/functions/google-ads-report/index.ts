// supabase/functions/google-ads-report/index.ts
//
// Pulls live conversion-action metrics from the Google Ads API for an
// organisation's connected account (supabase/functions/google-ads-connect
// stores the connection). See docs/decision-log.md ADR-0039: this function
// is genuinely unverified against the real Google Ads API — no developer
// token exists yet (that requires Google's own review process, outside
// this project's control — decision-log.md ADR-0037). If
// GOOGLE_ADS_DEVELOPER_TOKEN isn't set, this returns a structured
// "developer_token_not_configured" response instead of attempting the
// call, so the UI can show a clear blocked state rather than a raw failure.
import { createClient } from 'npm:@supabase/supabase-js@2.105.3'
import type { Database } from '../../../src/types/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { buildConversionActionGaql, parseConversionActionStats } from './lib.ts'

interface ReportBody {
  organisationId: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient<Database>(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Not authenticated.' }, 401)

    const body: ReportBody = await req.json()
    const { organisationId } = body
    if (!organisationId) return json({ error: 'organisationId is required.' }, 400)

    // Read access only — any active member (not just owner/admin) may view
    // the report, same as they can already view conversion_events.
    const { data: membership, error: membershipError } = await userClient
      .from('organisation_members')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (membershipError) return json({ error: membershipError.message }, 500)
    if (!membership) return json({ error: 'Not a member of this organisation.' }, 403)

    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')
    if (!developerToken) {
      return json({ status: 'developer_token_not_configured' }, 200)
    }

    const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey)

    const { data: connection, error: connectionError } = await serviceClient
      .from('google_ads_connections')
      .select('customer_id')
      .eq('organisation_id', organisationId)
      .maybeSingle()
    if (connectionError) return json({ error: connectionError.message }, 500)
    if (!connection) return json({ error: 'Google Ads is not connected for this organisation.' }, 400)

    const { data: refreshToken, error: tokenError } = await serviceClient.rpc('get_google_ads_refresh_token', {
      p_org_id: organisationId,
    })
    if (tokenError) return json({ error: tokenError.message }, 500)
    if (!refreshToken) return json({ error: 'Google Ads is not connected for this organisation.' }, 400)

    // Exchanges the stored refresh token for a fresh access token. Uses the
    // same OAuth client as Supabase Auth's own Google provider — set as a
    // separate Edge Function secret since Supabase doesn't expose its own
    // provider config to functions.
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text()
      return json({ error: `Failed to refresh Google Ads access token: ${detail}` }, 502)
    }
    const { access_token: accessToken } = await tokenResponse.json()

    const adsResponse = await fetch(
      `https://googleads.googleapis.com/v17/customers/${connection.customer_id}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: buildConversionActionGaql() }),
      }
    )
    if (!adsResponse.ok) {
      const detail = await adsResponse.text()
      return json({ error: `Google Ads API error: ${detail}` }, 502)
    }
    const adsData = await adsResponse.json()
    const stats = parseConversionActionStats(adsData.results ?? [])

    return json({ status: 'ok', stats }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
