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
    description: 'Document and verify your GA4 and Google Ads conversion events.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    view: 'preview',
    label: 'Preview',
    description: 'Simulate events against your container and see which tags fire.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
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
    <div className="mx-auto max-w-[980px] px-10 pt-10 pb-15">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-6 border-b border-border-subtle pb-6">
        <div>
          <h1 className="m-0 mb-1 text-[21px] font-semibold text-text-primary">Hello, {firstName}</h1>
          <p className="m-0 text-[13px] text-text-tertiary">Your tag management workspace</p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-md border border-border-subtle bg-surface-sunken px-3 py-1.5 font-mono text-[11px] ${
            hasToken ? 'text-success' : 'text-text-tertiary'
          }`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasToken ? 'bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]' : 'bg-text-faint'}`} />
          {hasToken ? 'GTM connected' : 'GTM disconnected'}
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
        {SECTIONS.map(section => (
          <button
            key={section.view}
            type="button"
            className="grid w-full grid-cols-[22px_1fr_18px] items-center gap-3 border-b border-border-subtle px-4 py-3.5 text-left transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:grid-cols-[22px_180px_1fr_18px]"
            onClick={() => setActiveView(section.view)}
          >
            <span className="flex items-center text-text-faint">{section.icon}</span>
            <h2 className="m-0 text-[13.5px] font-semibold text-text-primary">{section.label}</h2>
            <p className="m-0 hidden min-w-0 truncate text-[13px] text-text-tertiary md:block">{section.description}</p>
            <svg className="text-text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
