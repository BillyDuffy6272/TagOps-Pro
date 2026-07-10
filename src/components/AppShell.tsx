import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import HomeView from '../features/home/components/HomeView'
import TagsView from '../features/tags/components/TagsView'
import TriggersView from '../features/triggers/components/TriggersView'
import VariablesView from '../features/variables/components/VariablesView'
import ConversionsView from '../features/conversions/components/ConversionsView'

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
      case 'triggers':    return <TriggersView session={session} />
      case 'variables':   return <VariablesView session={session} />
      case 'conversions': return <ConversionsView session={session} />
    }
  }

  return (
    <div className="grid h-screen grid-cols-[284px_1fr] overflow-hidden bg-canvas text-text-primary">
      <Sidebar activeView={activeView} setActiveView={setActiveView} session={session} />
      <div className="flex min-w-0 flex-col overflow-hidden border-l border-border-subtle">
        <TopBar activeView={activeView} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-canvas">
          {renderView()}
        </main>
      </div>
    </div>
  )
}
