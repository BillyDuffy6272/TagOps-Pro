import { supabase } from '../lib/supabase'
import ViewHeader from './ViewHeader'

interface Props {
  title: string
}

export default function GtmForbiddenState({ title }: Props) {
  return (
    <div className="mx-auto max-w-[1200px] px-10 pt-11 pb-15">
      <ViewHeader title={title} />
      <div className="flex max-w-[500px] flex-col gap-3 py-12">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        <p className="m-0 text-[14.5px] font-semibold text-danger-text">GTM access denied (403)</p>
        <p className="m-0 text-[13px] leading-relaxed text-text-tertiary">
          Either the <strong className="font-medium text-text-secondary">Tag Manager API</strong> is not enabled in your Google Cloud project,
          or the GTM read permission wasn't granted during sign-in.
        </p>
        <ul className="m-0 pl-[18px] text-[12.5px] leading-loose text-text-tertiary">
          <li>Enable the API at <em className="not-italic">console.cloud.google.com → APIs &amp; Services → Tag Manager API</em></li>
          <li>Re-grant scope: sign out and sign in again, accepting the Tag Manager permission</li>
        </ul>
        <button
          type="button"
          className="self-start rounded-md border border-border px-3.5 py-1.5 text-[12.5px] text-text-tertiary transition-colors duration-150 ease-out hover:border-accent/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out and try again
        </button>
      </div>
    </div>
  )
}
