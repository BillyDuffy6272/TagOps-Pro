// supabase/functions/google-ads-connect/index.ts
//
// First Edge Function in this repo (ADR-0039). Persists the Google Ads
// OAuth refresh token captured by GoogleAdsConnectionPanel right after its
// "Connect Google Ads" redirect completes. The token itself is only ever
// held server-side from this point on — it's handed to
// store_google_ads_refresh_token (Supabase Vault, service_role only; see
// supabase/migrations/20260917010000_google_ads_connections.sql) and never
// returned to any client.
//
// Two Supabase clients, deliberately:
//   - `userClient`, built from the caller's own Authorization header, so
//     RLS decides what they can see — used only to confirm they're an
//     owner/admin of the organisation they're connecting.
//   - `serviceClient`, built from the service-role key (an Edge Function
//     secret, never shipped to the browser — Security Floor item 3), used
//     only for the one privileged RPC call.
import { createClient } from 'npm:@supabase/supabase-js@2.105.3'
import type { Database } from '../../../src/types/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface ConnectBody {
  organisationId: string
  refreshToken: string
  customerId: string
}

const CUSTOMER_ID_PATTERN = /^[0-9]{10}$/

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient<Database>(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      return json({ error: 'Not authenticated.' }, 401)
    }

    const body: ConnectBody = await req.json()
    const { organisationId, refreshToken, customerId } = body
    if (!organisationId || !refreshToken || !customerId) {
      return json({ error: 'organisationId, refreshToken and customerId are all required.' }, 400)
    }
    if (!CUSTOMER_ID_PATTERN.test(customerId)) {
      return json({ error: 'customerId must be exactly 10 digits.' }, 400)
    }

    // Only an owner/admin of this specific organisation may connect a
    // Google Ads account to it — mirrors the containers write-role gate
    // (owner/admin/editor), narrowed to owner/admin since this grants
    // access to real ad-account data, not just app data.
    const { data: membership, error: membershipError } = await userClient
      .from('organisation_members')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (membershipError) return json({ error: membershipError.message }, 500)
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return json({ error: 'Only an organisation owner or admin can connect Google Ads.' }, 403)
    }

    const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey)
    const { error: storeError } = await serviceClient.rpc('store_google_ads_refresh_token', {
      p_org_id: organisationId,
      p_refresh_token: refreshToken,
      p_customer_id: customerId,
      p_connected_by: userData.user.id,
    })
    if (storeError) return json({ error: storeError.message }, 500)

    return json({ ok: true }, 200)
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
