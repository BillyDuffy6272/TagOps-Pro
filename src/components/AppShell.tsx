import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { GtmProvider } from '../lib/GtmContext'
import HomeView from '../features/home/components/HomeView'
import TagsView from '../features/tags/components/TagsView'
import TriggersView from '../features/triggers/components/TriggersView'
import VariablesView from '../features/variables/components/VariablesView'
import ConversionsView from '../features/conversions/components/ConversionsView'
import PreviewView from '../features/preview/components/PreviewView'
import SettingsView from '../features/settings/components/SettingsView'
import OrganisationView from '../features/organisation/components/OrganisationView'

export type ActiveView = 'home' | 'tags' | 'triggers' | 'variables' | 'conversions' | 'preview' | 'settings' | 'organisation'

interface Props {
  session: Session
}

export default function AppShell({ session }: Props) {
  const [activeView, setActiveView] = useState<ActiveView>('home')
  const [pendingGoogleAdsRefreshToken, setPendingGoogleAdsRefreshToken] = useState<string | null>(null)

  // Landing here with ?gads=connect means the user just came back from the
  // "Connect Google Ads" OAuth redirect (GoogleAdsConnectionPanel) — a
  // separate, explicit grant of the adwords scope, never bundled into
  // Login.tsx's own signInWithOAuth call (decision-log.md ADR-0037/ADR-0039).
  // Supabase only ever exposes provider_refresh_token on the Session object
  // right after this exact auth event, so it has to be captured here, at
  // the app's top level, rather than re-read later.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gads') !== 'connect') return

    window.history.replaceState(null, '', window.location.pathname)
    if (session.provider_refresh_token) {
      setPendingGoogleAdsRefreshToken(session.provider_refresh_token)
    }
    setActiveView('conversions')
    // Only the redirect that carries the marker should ever consume it —
    // re-running this on every session refresh would keep resetting the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function renderView() {
    switch (activeView) {
      case 'home':        return <HomeView session={session} setActiveView={setActiveView} />
      case 'tags':        return <TagsView />
      case 'triggers':    return <TriggersView />
      case 'variables':   return <VariablesView />
      case 'conversions': return (
        <ConversionsView
          session={session}
          pendingGoogleAdsRefreshToken={pendingGoogleAdsRefreshToken}
          onConsumePendingGoogleAdsRefreshToken={() => setPendingGoogleAdsRefreshToken(null)}
        />
      )
      case 'preview':     return <PreviewView />
      case 'settings':    return <SettingsView session={session} setActiveView={setActiveView} />
      case 'organisation': return <OrganisationView session={session} />
    }
  }

  return (
    <GtmProvider session={session}>
      <div className="grid h-screen grid-cols-[284px_1fr] overflow-hidden bg-canvas text-text-primary">
        <Sidebar activeView={activeView} setActiveView={setActiveView} session={session} />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <TopBar activeView={activeView} />
          <main className="min-w-0 flex-1 overflow-y-auto bg-canvas">
            {renderView()}
          </main>
        </div>
      </div>
    </GtmProvider>
  )
}
