import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // PKCE returns an auth ?code= instead of tokens in the URL fragment.
      // Required for the desktop app (the code arrives via a loopback server
      // that can't see fragments) and the recommended flow on the web too.
      flowType: 'pkce',
    },
  }
)
