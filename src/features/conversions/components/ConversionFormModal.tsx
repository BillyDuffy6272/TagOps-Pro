import { useState, type FormEvent } from 'react'
import { createConversionEvent, updateConversionEvent } from '../api/conversions'
import type { Container, ConversionEventWithContainer } from '../types'
import './ConversionFormModal.css'

interface Props {
  containers: Container[]
  initial?: ConversionEventWithContainer
  onClose: () => void
  onSaved: () => void
}

const EVENT_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{initial ? 'Edit conversion event' : 'New conversion event'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="conversion-event-name">Event name</label>
              <input
                id="conversion-event-name"
                className="form-input"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="purchase"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="conversion-container">Container</label>
                <select
                  id="conversion-container"
                  className="form-select"
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

              <div className="form-group">
                <label className="form-label" htmlFor="conversion-currency">Currency</label>
                <input
                  id="conversion-currency"
                  className="form-input"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="conversion-display-name">Display name</label>
              <input
                id="conversion-display-name"
                className="form-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="conversion-value-param">Value parameter</label>
              <input
                id="conversion-value-param"
                className="form-input"
                value={valueParam}
                onChange={e => setValueParam(e.target.value)}
                placeholder="purchase_value"
              />
            </div>

            <label className="form-checkbox-row">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              Active
            </label>

            <div className="form-group">
              <label className="form-label" htmlFor="conversion-notes">Notes</label>
              <textarea
                id="conversion-notes"
                className="form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="modal-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create conversion event'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
