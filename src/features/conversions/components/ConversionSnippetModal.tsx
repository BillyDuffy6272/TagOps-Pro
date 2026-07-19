import { useState } from 'react'
import type { ConversionEventWithContainer } from '../types'
import { dataLayerConversionSnippet, gtagConversionSnippet } from '../lib/snippets'
import Modal from '../../../components/Modal'

interface Props {
  event: ConversionEventWithContainer
  onClose: () => void
}

type SnippetKind = 'gtag' | 'datalayer'

const TABS: { kind: SnippetKind; label: string; hint: string }[] = [
  { kind: 'gtag', label: 'gtag.js', hint: 'For sites with the Google tag installed directly.' },
  { kind: 'datalayer', label: 'dataLayer (GTM)', hint: 'For sites where GTM owns the page — pair with a Custom Event trigger.' },
]

export default function ConversionSnippetModal({ event, onClose }: Props) {
  const [kind, setKind] = useState<SnippetKind>('gtag')
  const [copied, setCopied] = useState(false)

  const snippet = kind === 'gtag' ? gtagConversionSnippet(event) : dataLayerConversionSnippet(event)
  const missingAdsSetup = kind === 'gtag' && !(event.containerGoogleAdsConversionId && event.conversion_label)

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Modal title={`Tracking code — ${event.display_name || event.event_name}`} onClose={onClose} maxWidth={620}>
      <div className="flex gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.kind}
            type="button"
            className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              kind === tab.kind
                ? 'bg-accent-muted text-accent'
                : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
            }`}
            onClick={() => setKind(tab.kind)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="m-0 text-[12.5px] text-text-tertiary">{TABS.find(t => t.kind === kind)!.hint}</p>

      {missingAdsSetup && (
        <div className="rounded-md border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-warning">
          This event isn't fully linked to Google Ads yet — the snippet below uses placeholders.
          Set the container's conversion ID and this event's conversion label to generate real values.
        </div>
      )}

      <pre className="m-0 overflow-x-auto rounded-md border border-border-subtle bg-surface-sunken p-4 font-mono text-[12px] leading-relaxed text-text-secondary">
        {snippet}
      </pre>

      <button
        type="button"
        className="self-start rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay"
        onClick={handleCopy}
      >
        {copied ? 'Copied!' : 'Copy snippet'}
      </button>
    </Modal>
  )
}
