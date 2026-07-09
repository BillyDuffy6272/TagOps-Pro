import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ActiveView } from '../../../components/AppShell'
import './HomeView.css'

interface SectionCard {
  view: ActiveView
  label: string
  description: string
  icon: ReactNode
}

const SECTIONS: SectionCard[] = [
  {
    view: 'tags',
    label: 'Tags',
    description: 'View and filter all tags synced from your GTM container.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    view: 'triggers',
    label: 'Triggers',
    description: 'Manage the conditions that fire your tags.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    view: 'variables',
    label: 'Variables',
    description: 'Track data layer variables and their expected values.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    view: 'conversions',
    label: 'Conversions',
    description: 'Document and verify your GA4 conversion events.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
]

interface Props {
  session: Session
  setActiveView: (view: ActiveView) => void
}

export default function HomeView({ session, setActiveView }: Props) {
  const user = session.user
  const fullName = user.user_metadata?.full_name as string | undefined
  const firstName = fullName?.split(' ')[0] ?? 'there'
  const hasToken = Boolean(session.provider_token)

  return (
    <div className="home-view">
      <header className="home-header">
        <div>
          <h1 className="home-title">Hello, {firstName}</h1>
          <p className="home-sub">Your tag management workspace</p>
        </div>
        <div className={`gtm-badge${hasToken ? ' gtm-on' : ' gtm-off'}`}>
          <span className="gtm-dot" />
          {hasToken ? 'GTM connected' : 'GTM disconnected'}
        </div>
      </header>

      <div className="home-grid">
        {SECTIONS.map(section => (
          <button
            key={section.view}
            className="home-card"
            onClick={() => setActiveView(section.view)}
          >
            <div className="home-card-top">
              <span className="home-card-icon">{section.icon}</span>
            </div>
            <h2 className="home-card-label">{section.label}</h2>
            <p className="home-card-desc">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
