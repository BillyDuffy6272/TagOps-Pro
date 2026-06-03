import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import HomeView from '../features/home/components/HomeView'
import TagsView from '../features/tags/components/TagsView'
import TriggersView from '../features/triggers/components/TriggersView'
import VariablesView from '../features/variables/components/VariablesView'
import ConversionsView from '../features/conversions/components/ConversionsView'
import './AppShell.css'

export type ActiveView = 'home' | 'tags' | 'triggers' | 'variables' | 'conversions'

interface Props {
  session: Session
}

export default function AppShell({ session }: Props) {
  const [activeView, setActiveView] = useState<ActiveView>('home')

  function renderView() {
    switch (activeView) {
      case 'home':        return <HomeView session={session} setActiveView={setActiveView} />
      case 'tags':        return <TagsView session={session} />
      case 'triggers':    return <TriggersView />
      case 'variables':   return <VariablesView />
      case 'conversions': return <ConversionsView />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} session={session} />
      <main className="shell-content">
        {renderView()}
      </main>
    </div>
  )
}
