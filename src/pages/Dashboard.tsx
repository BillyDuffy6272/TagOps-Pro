import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { checkMyMembership } from '../lib/organisation'
import AppShell from '../components/AppShell'
import OrganisationOnboarding from '../features/organisation/components/OrganisationOnboarding'
import Spinner from '../components/Spinner'

interface Props {
  session: Session
}

type MembershipState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'found' }
  | { status: 'error'; message: string }

export default function Dashboard({ session }: Props) {
  const [membership, setMembership] = useState<MembershipState>({ status: 'loading' })

  const refresh = useCallback(() => {
    setMembership({ status: 'loading' })
    checkMyMembership(session.user.id)
      .then(found => setMembership(found ? { status: 'found' } : { status: 'none' }))
      .catch(e => setMembership({ status: 'error', message: e instanceof Error ? e.message : 'Failed to load your account.' }))
  }, [session.user.id])

  useEffect(() => { refresh() }, [refresh])

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

  if (membership.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner size={28} />
      </div>
    )
  }

  if (membership.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center text-[15px] text-text-primary">
        <p className="m-0 text-text-tertiary">{membership.message}</p>
        <button
          type="button"
          className="rounded-md bg-accent px-5 py-2 text-[13.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          onClick={refresh}
        >
          Try again
        </button>
      </div>
    )
  }

  // A brand-new sign-in has a public.users row (via handle_new_user()) but
  // no organisation_members row yet — every organisation-scoped page below
  // would otherwise just error, so this gate is the actual onboarding step.
  if (membership.status === 'none') {
    return <OrganisationOnboarding session={session} onJoined={refresh} />
  }

  return <AppShell session={session} />
}
