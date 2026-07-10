import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ActiveView } from '../../../components/AppShell'

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
    <div className="mx-auto max-w-[860px] px-10 pt-11 pb-15">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="m-0 mb-1 text-[22px] font-semibold tracking-[-0.02em] text-text-primary">Hello, {firstName}</h1>
          <p className="m-0 text-xs text-text-tertiary">Your tag management workspace</p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface-sunken px-3 py-1.5 font-mono text-[11px] ${
            hasToken ? 'text-success' : 'text-text-tertiary'
          }`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasToken ? 'bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]' : 'bg-text-faint'}`} />
          {hasToken ? 'GTM connected' : 'GTM disconnected'}
        </div>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2.5">
        {SECTIONS.map(section => (
          <button
            key={section.view}
            type="button"
            className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-5 text-left transition-[border-color,box-shadow] duration-150 ease-out hover:border-white/12 hover:shadow-lg hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => setActiveView(section.view)}
          >
            <span className="flex items-center text-accent">{section.icon}</span>
            <h2 className="m-0 text-[13.5px] font-semibold text-text-primary">{section.label}</h2>
            <p className="m-0 text-xs leading-relaxed text-text-tertiary">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
