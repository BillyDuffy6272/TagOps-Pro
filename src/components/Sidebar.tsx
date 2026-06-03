import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ActiveView } from './AppShell'
import { supabase } from '../lib/supabase'
import './Sidebar.css'

interface NavItem {
  id: ActiveView
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    id: 'triggers',
    label: 'Triggers',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: 'variables',
    label: 'Variables',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: 'conversions',
    label: 'Conversions',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
]

interface Props {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  session: Session
}

export default function Sidebar({ activeView, setActiveView, session }: Props) {
  const user = session.user
  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'User'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="20" height="20" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#6366f1" />
          <polygon points="18,8 28,14 28,26 18,32 8,26 8,14" fill="#1e1b4b" />
          <circle cx="18" cy="18" r="4" fill="#a5b4fc" />
        </svg>
        <span className="sidebar-logo-text">TagOps Pro</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeView === item.id ? ' nav-item-active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="sidebar-avatar" />
            : <div className="sidebar-avatar-fallback" aria-hidden="true">{userName.charAt(0).toUpperCase()}</div>
          }
          <span className="sidebar-user-name" title={userName}>{userName}</span>
        </div>
        <button className="sidebar-signout" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
