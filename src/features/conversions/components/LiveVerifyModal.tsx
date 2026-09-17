import { useCallback, useEffect, useState } from 'react'
import { listCapturedLiveEvents } from '../api/conversions'
import { buildLiveVerificationSnippet, LIVE_CHECK_DURATION_MINUTES } from '../lib/liveVerification'
import type { ConversionEventWithContainer, LiveVerificationEvent } from '../types'
import Modal from '../../../components/Modal'

interface Props {
  event: ConversionEventWithContainer
  organisationId: string
  onClose: () => void
}

const POLL_INTERVAL_MS = 2000

export default function LiveVerifyModal({ event, organisationId, onClose }: Props) {
  const [checkToken, setCheckToken] = useState(() => crypto.randomUUID())
  const [captured, setCaptured] = useState<LiveVerificationEvent[]>([])
  const [copied, setCopied] = useState(false)
  const [watching, setWatching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const snippet = buildLiveVerificationSnippet({
    checkToken,
    conversionEventId: event.id,
    organisationId,
  })

  const poll = useCallback(async () => {
    try {
      setCaptured(await listCapturedLiveEvents(checkToken))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check for results.')
    }
  }, [checkToken])

  useEffect(() => {
    if (!watching) return
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    const stopTimeout = setTimeout(() => setWatching(false), (LIVE_CHECK_DURATION_MINUTES + 1) * 60 * 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(stopTimeout)
    }
  }, [watching, poll])

  function handleNewCheck() {
    setCheckToken(crypto.randomUUID())
    setCaptured([])
    setError(null)
    setWatching(true)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const matched = captured.some(c => c.event_name === event.event_name)

  return (
    <Modal title={`Verify on your live site — ${event.display_name || event.event_name}`} onClose={onClose} maxWidth={620}>
      <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-text-secondary">
        <li>Copy the snippet below.</li>
        <li>Open your real site in a new tab, then open its browser console (F12, or right-click → Inspect → Console).</li>
        <li>Paste the snippet and press Enter. (Chrome may ask you to type "allow pasting" first — that's normal.)</li>
        <li>Do the thing that should trigger <code className="rounded bg-surface-sunken px-1 py-0.5 font-mono text-[12px] text-accent">{event.event_name}</code> — e.g. complete a purchase or submit the form.</li>
        <li>Come back here — results appear automatically, no need to refresh.</li>
      </ol>

      <pre className="m-0 max-h-[160px] overflow-auto rounded-md border border-border-subtle bg-surface-sunken p-4 font-mono text-[11.5px] leading-relaxed text-text-secondary">
        {snippet}
      </pre>

      <button
        type="button"
        className="self-start rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay"
        onClick={handleCopy}
      >
        {copied ? 'Copied!' : 'Copy snippet'}
      </button>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger-text">{error}</div>
      )}

      <div className="rounded-lg border border-border-subtle bg-surface-sunken p-4" role="status" aria-live="polite">
        {matched ? (
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Verified — we saw "{event.event_name}" fire on your site.
          </div>
        ) : watching ? (
          <div className="flex items-center gap-2.5 text-[13px] text-text-tertiary">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            Watching for activity… (this check stays open for {LIVE_CHECK_DURATION_MINUTES} minutes)
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-text-tertiary">This check has timed out.</span>
            <button
              type="button"
              className="shrink-0 rounded-md border border-border bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={handleNewCheck}
            >
              Start a new check
            </button>
          </div>
        )}

        {captured.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border-subtle pt-3">
            <span className="text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
              Events seen on your site
            </span>
            {captured.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                <code className={`font-mono ${c.event_name === event.event_name ? 'text-success' : 'text-text-tertiary'}`}>
                  {c.event_name ?? '(no event name)'}
                </code>
                <span className="text-[11px] text-text-faint">{new Date(c.captured_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
