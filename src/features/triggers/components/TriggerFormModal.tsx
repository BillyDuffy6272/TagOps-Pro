import { useState, type FormEvent } from 'react'
import type { Json } from '../../../types/supabase'
import { createTrigger, updateTrigger } from '../api/triggers'
import {
  TRIGGER_TYPE_LABELS,
  TRIGGER_TYPES,
  type Condition,
  type Container,
  type TriggerType,
  type TriggerWithTags,
} from '../types'
import './TriggerFormModal.css'

interface Props {
  containers: Container[]
  initial?: TriggerWithTags
  onClose: () => void
  onSaved: () => void
}

function conditionsFromJson(value: Json): Condition[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((row): row is Record<string, Json> => typeof row === 'object' && row !== null && !Array.isArray(row))
    .map(row => ({
      var: typeof row.var === 'string' ? row.var : '',
      op: typeof row.op === 'string' ? row.op : '',
      val: typeof row.val === 'string' ? row.val : '',
    }))
}

export default function TriggerFormModal({ containers, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [containerId, setContainerId] = useState(initial?.container_id ?? containers[0]?.id ?? '')
  const [triggerType, setTriggerType] = useState<TriggerType>(initial?.trigger_type ?? 'pageview')
  const [eventName, setEventName] = useState(initial?.event_name ?? '')
  const [conditions, setConditions] = useState<Condition[]>(
    initial ? conditionsFromJson(initial.conditions) : []
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function removeCondition(index: number) {
    setConditions(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (trimmedName.length < 1 || trimmedName.length > 150) {
      setError('Name must be between 1 and 150 characters.')
      return
    }
    const container = containers.find(c => c.id === containerId)
    if (!container) {
      setError('Select a container.')
      return
    }
    const trimmedEventName = eventName.trim()
    if (triggerType === 'custom_event' && trimmedEventName.length === 0) {
      setError('Event name is required for custom event triggers.')
      return
    }
    const cleanConditions = conditions
      .map(c => ({ var: c.var.trim(), op: c.op.trim(), val: c.val.trim() }))
      .filter(c => c.var && c.op && c.val)

    setSaving(true)
    try {
      const payload = {
        container_id: container.id,
        organisation_id: container.organisation_id,
        name: trimmedName,
        trigger_type: triggerType,
        event_name: triggerType === 'custom_event' ? trimmedEventName : null,
        // Condition[] is structurally a valid JSON value; bridge the named
        // interface to the recursive Json union type used by the DB column.
        conditions: cleanConditions as unknown as Json,
        notes: notes.trim() || null,
      }

      if (initial) {
        await updateTrigger(initial.id, payload)
      } else {
        await createTrigger(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trigger.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{initial ? 'Edit trigger' : 'New trigger'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="trigger-name">Name</label>
              <input
                id="trigger-name"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={150}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="trigger-container">Container</label>
                <select
                  id="trigger-container"
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
                <label className="form-label" htmlFor="trigger-type">Type</label>
                <select
                  id="trigger-type"
                  className="form-select"
                  value={triggerType}
                  onChange={e => setTriggerType(e.target.value as TriggerType)}
                >
                  {TRIGGER_TYPES.map(t => (
                    <option key={t} value={t}>{TRIGGER_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            {triggerType === 'custom_event' && (
              <div className="form-group">
                <label className="form-label" htmlFor="trigger-event-name">Event name</label>
                <input
                  id="trigger-event-name"
                  className="form-input"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  placeholder="purchase"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <div className="form-label-row">
                <span className="form-label">Conditions</span>
                <button
                  type="button"
                  className="condition-add-btn"
                  onClick={() => setConditions(prev => [...prev, { var: '', op: '', val: '' }])}
                >
                  + Add condition
                </button>
              </div>
              {conditions.map((condition, i) => (
                <div className="condition-row" key={i}>
                  <input
                    className="form-input condition-input"
                    placeholder="variable"
                    value={condition.var}
                    onChange={e => updateCondition(i, { var: e.target.value })}
                  />
                  <input
                    className="form-input condition-input"
                    placeholder="operator"
                    value={condition.op}
                    onChange={e => updateCondition(i, { op: e.target.value })}
                  />
                  <input
                    className="form-input condition-input"
                    placeholder="value"
                    value={condition.val}
                    onChange={e => updateCondition(i, { val: e.target.value })}
                  />
                  <button
                    type="button"
                    className="condition-remove-btn"
                    onClick={() => removeCondition(i)}
                    aria-label="Remove condition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="trigger-notes">Notes</label>
              <textarea
                id="trigger-notes"
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
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create trigger'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
