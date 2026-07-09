import { useState, type FormEvent } from 'react'
import { createVariable, updateVariable } from '../api/variables'
import {
  VARIABLE_TYPE_LABELS,
  VARIABLE_TYPES,
  type Container,
  type VariableType,
  type VariableWithContainer,
} from '../types'
import './VariableFormModal.css'

interface Props {
  containers: Container[]
  initial?: VariableWithContainer
  onClose: () => void
  onSaved: () => void
}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export default function VariableFormModal({ containers, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [containerId, setContainerId] = useState(initial?.container_id ?? containers[0]?.id ?? '')
  const [variableType, setVariableType] = useState<VariableType>(initial?.variable_type ?? 'datalayer')
  const [defaultValue, setDefaultValue] = useState(initial?.default_value ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!NAME_PATTERN.test(trimmedName)) {
      setError('Name must start with a letter or underscore and contain only letters, numbers, and underscores.')
      return
    }
    const container = containers.find(c => c.id === containerId)
    if (!container) {
      setError('Select a container.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        container_id: container.id,
        organisation_id: container.organisation_id,
        name: trimmedName,
        variable_type: variableType,
        default_value: defaultValue.trim() || null,
        notes: notes.trim() || null,
      }

      if (initial) {
        await updateVariable(initial.id, payload)
      } else {
        await createVariable(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save variable.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{initial ? 'Edit variable' : 'New variable'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="variable-name">Name</label>
              <input
                id="variable-name"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="purchase_value"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="variable-container">Container</label>
                <select
                  id="variable-container"
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
                <label className="form-label" htmlFor="variable-type">Type</label>
                <select
                  id="variable-type"
                  className="form-select"
                  value={variableType}
                  onChange={e => setVariableType(e.target.value as VariableType)}
                >
                  {VARIABLE_TYPES.map(t => (
                    <option key={t} value={t}>{VARIABLE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="variable-default">Default value</label>
              <input
                id="variable-default"
                className="form-input"
                value={defaultValue}
                onChange={e => setDefaultValue(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="variable-notes">Notes</label>
              <textarea
                id="variable-notes"
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
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create variable'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
