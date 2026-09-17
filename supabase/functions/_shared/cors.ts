// Shared by every Edge Function the browser calls directly via
// supabase.functions.invoke(). Without these headers the browser's
// preflight OPTIONS request fails before the function ever runs its own
// logic, since the Functions endpoint is a different origin from the
// Vercel-hosted app.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
