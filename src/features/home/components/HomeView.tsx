import { useId, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ActiveView } from '../../../components/AppShell'

interface SectionCard {
  view: ActiveView
  label: string
  description: string
  guide: string
  icon: ReactNode
}

const SECTIONS: SectionCard[] = [
  {
    view: 'tags',
    label: 'Tags',
    description: 'View and filter all tags synced from your GTM container.',
    guide:
      "A tag is a small piece of tracking code — like the Google Ads or GA4 snippet that records a page visit or a purchase. This page lists every tag in your GTM container, whether it's currently on or paused, and what kind of tag it is, so you can see at a glance what's actually running on your site without opening Google Tag Manager itself.",
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
    guide:
      "A trigger is the condition that decides when a tag actually fires — for example, \"when someone clicks the Submit button\" or \"when someone reaches the thank-you page.\" This page shows what has to happen for each of your tags to activate, so you can check the logic behind your tracking without digging through GTM's own interface.",
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
    guide:
      "Variables are the small pieces of information your tags and triggers rely on — things like a button's ID, the current page URL, or a value pulled from your site's data layer. This page lists what each variable is expected to capture, which helps you spot when a tag might be misfiring because a variable isn't returning what it should.",
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
    guide:
      'Conversions are the actions that actually matter to your business — a completed purchase, a submitted enquiry form, a phone number click. This page documents every conversion event you track in GA4 and Google Ads, including the exact code snippet used to record it, so you or whoever set it up can confirm it\'s still wired up correctly.',
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
    guide:
      "Before trusting your tracking data, it helps to test it. This page lets you simulate real visitor actions — a page view, a click, a form submission — and see exactly which tags would fire and what data they'd send, without needing to open GTM's own, fairly technical, preview mode.",
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
  const [guideOpen, setGuideOpen] = useState(false)
  const guideId = useId()

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
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasToken ? 'animate-pulse bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.15)]' : 'bg-text-faint'}`} />
          {hasToken ? 'GTM connected' : 'GTM disconnected'}
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
        {SECTIONS.map(section => (
          <button
            key={section.view}
            type="button"
            className="grid w-full grid-cols-[22px_1fr_18px] items-center gap-3 border-b border-border-subtle px-4 py-3.5 text-left transition-colors duration-150 ease-out last:border-b-0 hover:bg-overlay/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:grid-cols-[22px_180px_1fr_18px]"
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

      <section className="mt-10">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-sunken px-4 py-3.5 text-left transition-colors duration-150 ease-out hover:bg-overlay/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setGuideOpen(open => !open)}
          aria-expanded={guideOpen}
          aria-controls={guideId}
        >
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-text-primary">New here? Here's what each page shows</span>
            <span className="block text-[12px] text-text-tertiary">A quick guide if you're not familiar with Google Tag Manager or GA4 terms.</span>
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`shrink-0 text-text-faint transition-transform duration-150 ease-out ${guideOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {guideOpen && (
          <div id={guideId} className="flex flex-col gap-5 px-1 pt-5">
            {SECTIONS.map(section => (
              <article key={section.view} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-sunken text-text-tertiary" aria-hidden="true">
                  {section.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 mb-1 text-[13.5px] font-semibold text-text-primary">{section.label}</h3>
                  <p className="m-0 text-[13px] leading-relaxed text-text-tertiary">{section.guide}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
