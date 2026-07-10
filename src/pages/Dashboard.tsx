import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'

interface Props {
  session: Session
}

export default function Dashboard({ session }: Props) {
  if (!session.provider_token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center text-[15px] text-text-primary">
        <p className="m-0 text-text-tertiary">Your Google session has expired. Please sign in again.</p>
        <button
          type="button"
          className="rounded-md bg-accent px-5 py-2 text-[13.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    )
  }

  return <AppShell session={session} />
}
