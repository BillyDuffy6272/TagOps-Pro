import type { ReactNode } from 'react'
import { useTheme } from '../lib/ThemeContext'

interface Props {
  onGetStarted: () => void
}

interface Feature {
  title: string
  description: string
  icon: ReactNode
}

const ICON_PROPS = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const FEATURES: Feature[] = [
  {
    title: 'Tags, triggers & variables, live',
    description: "See everything in your GTM container — tags, triggers, and variables — read straight from Google, so it's never out of date.",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    title: 'Conversion tracking, documented',
    description: 'Record every GA4 and Google Ads conversion event, link it to your Ads account, and copy ready-to-paste tracking code when you need it.',
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    title: 'Preview before it goes live',
    description: "Simulate a page view, a click, or a form submit, and see exactly which tags would fire — without touching your real site.",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  },
  {
    title: 'Roles that actually mean something',
    description: 'Owner, Admin, Editor and Viewer each have genuinely different access, enforced at the database — not just a hidden button.',
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Sign in with the account you use already',
    description: "No new password to remember — sign in with the Google account you use for Tag Manager, with read-only access.",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Light, dark, or system',
    description: 'A theme that follows your device automatically, or pick one yourself — every screen adapts.',
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
]

export default function Landing({ onGetStarted }: Props) {
  const { resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <img
            src={resolvedTheme === 'light' ? '/favicon-light.svg' : '/favicon.svg'}
            alt=""
            width="28"
            height="28"
            className="rounded-md"
          />
          <span className="text-[15px] font-semibold text-text-primary">TagOps Pro</span>
        </div>
        <nav className="hidden items-center gap-8 text-[13.5px] font-medium text-text-tertiary sm:flex">
          <a href="#features" className="transition-colors duration-150 ease-out hover:text-text-primary">Features</a>
        </nav>
        <button
          type="button"
          onClick={onGetStarted}
          className="rounded-md border border-border bg-surface-sunken px-4 py-2 text-[13px] font-semibold text-text-primary transition-colors duration-150 ease-out hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sign in
        </button>
      </header>

      <main>
        <section className="mx-auto flex max-w-[820px] flex-col items-center px-6 pt-16 pb-6 text-center sm:pt-24">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 text-[12px] font-medium text-text-tertiary">
              Built for Google Tag Manager
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 text-[12px] font-medium text-text-tertiary">
              Read-only — nothing changes on your site
            </span>
          </div>

          <h1 className="m-0 text-[38px] leading-[1.1] font-bold tracking-[-0.02em] text-text-primary sm:text-[52px]">
            Clarity for your <span className="text-accent">Google Tag Manager</span> setup
          </h1>

          <p className="m-0 mt-5 max-w-[540px] text-[16px] leading-relaxed text-text-tertiary">
            Tags, triggers, variables and conversion events, pulled into one place you can actually understand —
            so you always know what's tracked and what's not, without digging through Google's own tools.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-[14.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Get started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <a
              href="#features"
              className="rounded-lg px-5 py-3 text-[14.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary"
            >
              See what it does
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-[760px] px-6 pt-10 pb-24 sm:pb-32">
          <div className="relative">
            <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-[0_24px_48px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">Tags · Main site</div>
              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-sunken px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface text-text-tertiary" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">GA4 – Purchase Event</div>
                      <div className="text-[11.5px] text-text-faint">Fires on: Purchase Trigger</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-success/10 px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-success uppercase">Active</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-sunken px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface text-text-tertiary" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">Google Ads – Remarketing</div>
                      <div className="text-[11.5px] text-text-faint">Fires on: All Pages</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-warning/10 px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-warning uppercase">Paused</span>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 -bottom-8 w-[190px] rounded-xl border border-border bg-surface p-4 shadow-[0_16px_36px_rgba(0,0,0,0.3)] sm:-right-8 sm:w-[210px]">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-sunken text-text-tertiary" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </span>
                <span className="text-[13px] font-semibold text-text-primary">Purchase</span>
              </div>
              <div className="mt-2 text-[11px] text-text-tertiary">Linked to Google Ads</div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                Ready
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border-subtle bg-surface-sunken/40 py-20 sm:py-24">
          <div className="mx-auto max-w-[1040px] px-6 sm:px-10">
            <div className="mx-auto max-w-[560px] text-center">
              <h2 className="m-0 text-[26px] font-bold tracking-[-0.01em] text-text-primary sm:text-[32px]">
                Everything your tracking setup needs, in one screen
              </h2>
              <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-text-tertiary">
                Built for business owners who don't want to become a Tag Manager expert just to know what's running on their own site.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(feature => (
                <div key={feature.title} className="rounded-xl border border-border-subtle bg-surface p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-sunken text-accent" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3 className="m-0 mt-4 text-[14.5px] font-semibold text-text-primary">{feature.title}</h3>
                  <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-text-tertiary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[640px] px-6 py-24 text-center sm:py-28">
          <h2 className="m-0 text-[26px] font-bold tracking-[-0.01em] text-text-primary sm:text-[30px]">
            Stop guessing what's actually tracked.
          </h2>
          <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-text-tertiary">
            Sign in with Google and see your setup in under a minute.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="mt-7 rounded-lg bg-accent px-6 py-3 text-[14.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Get started
          </button>
        </section>
      </main>

      <footer className="border-t border-border-subtle px-6 py-8 text-center text-[12px] text-text-faint">
        TagOps Pro — Clarity for your Google Tag Manager setup.
      </footer>
    </div>
  )
}
