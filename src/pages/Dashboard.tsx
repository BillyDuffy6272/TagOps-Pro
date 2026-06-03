import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import './Dashboard.css'

interface Props {
  session: Session
}

export default function Dashboard({ session }: Props) {
  if (!session.provider_token) {
    return (
      <div className="token-gate">
        <p>Your Google session has expired. Please sign in again.</p>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    )
  }

  return <AppShell session={session} />
}
