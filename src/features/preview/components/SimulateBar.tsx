import { useState, type FormEvent } from 'react'
import { SIMULATED_ACTIONS } from '../lib/simulator'

interface Props {
  onSimulate: (name: string, data: Record<string, unknown>) => void
}

const EVENT_NAME_PATTERN = /^[\w.-]+$/

// Palette of one-click simulated interactions plus a custom dataLayer push,
// standing in for the real page interactions GTM preview would capture.
export default function SimulateBar({ onSimulate }: Props) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPayload, setCustomPayload] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    const name = customName.trim()
    if (!EVENT_NAME_PATTERN.test(name)) {
      setFormError('Event name can only contain letters, numbers, dots, dashes and underscores.')
      return
    }

    let data: Record<string, unknown> = {}
    const payload = customPayload.trim()
    if (payload) {
      try {
        const parsed: unknown = JSON.parse(payload)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setFormError('Payload must be a JSON object, e.g. {"purchase_value": 49.99}.')
          return
        }
        data = parsed as Record<string, unknown>
      } catch {
        setFormError('Payload is not valid JSON.')
        return
      }
    }

    onSimulate(name, data)
    setCustomName('')
    setCustomPayload('')
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-sunken/70 p-3">
      <div className="mb-2 text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Simulate an interaction</div>
      <div className="flex flex-wrap gap-1.5">
        {SIMULATED_ACTIONS.map(action => (
          <button
            key={action.name}
            type="button"
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-1.5 text-[12.5px] font-medium text-text-secondary transition-colors duration-150 ease-out hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => onSimulate(action.name, action.data)}
            title={`Push ${action.name}`}
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            customOpen
              ? 'border-accent/25 bg-accent-muted text-accent'
              : 'border-white/10 bg-surface-raised text-text-secondary hover:bg-white/10 hover:text-text-primary'
          }`}
          onClick={() => setCustomOpen(open => !open)}
          aria-expanded={customOpen}
        >
          Custom event…
        </button>
      </div>

      {customOpen && (
        <form className="mt-3 flex flex-col gap-2.5 border-t border-border-subtle pt-3" onSubmit={handleCustomSubmit}>
          {formError && (
            <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] text-danger-text">{formError}</div>
          )}
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="custom-event-name" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Event name</label>
              <input
                id="custom-event-name"
                className="w-[200px] rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-[12.5px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="purchase"
                required
              />
            </div>
            <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
              <label htmlFor="custom-event-payload" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Data layer payload (optional JSON)</label>
              <input
                id="custom-event-payload"
                className="rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-[12.5px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                value={customPayload}
                onChange={e => setCustomPayload(e.target.value)}
                placeholder='{"purchase_value": 49.99, "currency": "AUD"}'
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Push event
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
