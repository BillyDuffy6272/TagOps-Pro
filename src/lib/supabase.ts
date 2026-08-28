import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Re-exported for the live dataLayer-verification snippet (see
// features/conversions/lib/liveVerification.ts) — it needs the same URL and
// anon key to write from a third-party site's browser console, where there's
// no Supabase session at all. Both values are already public in the client
// bundle; exporting them just avoids reading import.meta.env in a second place.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // PKCE returns an auth ?code= instead of tokens in the URL fragment.
      // Required for the desktop app (the code arrives via a loopback server
      // that can't see fragments) and the recommended flow on the web too.
      flowType: 'pkce',
    },
  }
)

// The `{ data, error }` PostgREST returns is a plain object ({message, code,
// details, hint}), NOT an Error instance — postgrest-js only constructs a
// real PostgrestError when .throwOnError() is used, which nothing in this
// app does. Every `catch (err) { err instanceof Error ? err.message : … }`
// block relies on the thrown value actually being an Error, so `throw error`
// on a raw Supabase error silently swallows the real message behind a
// generic fallback. Every throw site should wrap with this first.
export function toError(error: { message: string } | Error): Error {
  return error instanceof Error ? error : new Error(error.message)
}
