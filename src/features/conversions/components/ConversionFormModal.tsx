import { useState, type FormEvent } from 'react'
import { createConversionEvent, updateConversionEvent } from '../api/conversions'
import type { Container, ConversionEventWithContainer } from '../types'
import Modal from '../../../components/Modal'

interface Props {
  containers: Container[]
  initial?: ConversionEventWithContainer
  onClose: () => void
  onSaved: () => void
}

const EVENT_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/

const FIELD_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'
const FIELD_INPUT =
  'rounded-md border border-border bg-surface px-2.5 py-2 font-sans text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent'

export default function ConversionFormModal({ containers, initial, onClose, onSaved }: Props) {
  const [eventName, setEventName] = useState(initial?.event_name ?? '')
  const [containerId, setContainerId] = useState(initial?.container_id ?? containers[0]?.id ?? '')
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '')
  const [valueParam, setValueParam] = useState(initial?.value_param ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'AUD')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedEventName = eventName.trim()
    if (!EVENT_NAME_PATTERN.test(trimmedEventName)) {
      setError('Event name must be lowercase, start with a letter or underscore, and contain only letters, numbers, and underscores.')
      return
    }
    const container = containers.find(c => c.id === containerId)
    if (!container) {
      setError('Select a container.')
      return
    }
    const trimmedCurrency = currency.trim().toUpperCase()
    if (trimmedCurrency.length !== 3) {
      setError('Currency must be a 3-letter code, e.g. AUD.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        container_id: container.id,
        organisation_id: container.organisation_id,
        event_name: trimmedEventName,
        display_name: displayName.trim() || null,
        value_param: valueParam.trim() || null,
        currency: trimmedCurrency,
        is_active: isActive,
        notes: notes.trim() || null,
      }

      if (initial) {
        await updateConversionEvent(initial.id, payload)
      } else {
        await createConversionEvent(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save conversion event.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        title={initial ? 'Edit conversion event' : 'New conversion event'}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-border bg-transparent px-4 py-1.5 text-[13px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create conversion event'}
            </button>
          </>
        }
      >
        {error && (
          <div className="rounded-md border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger-text">{error}</div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="conversion-event-name">Event name</label>
          <input
            id="conversion-event-name"
            className={FIELD_INPUT}
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            placeholder="purchase"
            required
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={FIELD_LABEL} htmlFor="conversion-container">Container</label>
            <select
              id="conversion-container"
              className={`${FIELD_INPUT} cursor-pointer`}
              value={containerId}
              onChange={e => setContainerId(e.target.value)}
              required
            >
              {containers.length === 0 && <option value="">No containers available</option>}
              {containers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label className={FIELD_LABEL} htmlFor="conversion-currency">Currency</label>
            <input
              id="conversion-currency"
              className={FIELD_INPUT}
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              maxLength={3}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="conversion-display-name">Display name</label>
          <input
            id="conversion-display-name"
            className={FIELD_INPUT}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="conversion-value-param">Value parameter</label>
          <input
            id="conversion-value-param"
            className={FIELD_INPUT}
            value={valueParam}
            onChange={e => setValueParam(e.target.value)}
            placeholder="purchase_value"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
          <input
            type="checkbox"
            className="accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="conversion-notes">Notes</label>
          <textarea
            id="conversion-notes"
            className={`${FIELD_INPUT} resize-y`}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </form>
  )
}
