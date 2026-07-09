import { useCallback, useEffect, useState } from 'react'
import { deleteTrigger, listContainers, listTriggers } from '../api/triggers'
import {
  TRIGGER_TYPE_LABELS,
  TRIGGER_TYPES,
  type Container,
  type TriggerType,
  type TriggerWithTags,
} from '../types'
import TriggerCard from './TriggerCard'
import TriggerFormModal from './TriggerFormModal'
import './TriggersView.css'

type TypeFilter = 'all' | TriggerType

export default function TriggersView() {
  const [triggers, setTriggers] = useState<TriggerWithTags[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState<TriggerWithTags | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const [fetchedTriggers, fetchedContainers] = await Promise.all([listTriggers(), listContainers()])
      setTriggers(fetchedTriggers)
      setContainers(fetchedContainers)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load triggers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreateModal() {
    setEditingTrigger(undefined)
    setModalOpen(true)
  }

  function openEditModal(trigger: TriggerWithTags) {
    setEditingTrigger(trigger)
    setModalOpen(true)
  }

  async function handleDelete(trigger: TriggerWithTags) {
    if (!window.confirm(`Delete "${trigger.name}"? This can't be undone from here.`)) return
    try {
      await deleteTrigger(trigger.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete trigger')
    }
  }

  function handleSaved() {
    setModalOpen(false)
    load()
  }

  const filteredTriggers = triggers.filter(t => {
    const matchesType = typeFilter === 'all' || t.trigger_type === typeFilter
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.trigger_type.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  const linkedCount = triggers.filter(t => t.tags.length > 0).length

  return (
    <div className="triggers-view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Triggers</h1>
          <p className="view-sub">Conditions that fire your tags</p>
        </div>
        <button className="new-trigger-btn" onClick={openCreateModal} disabled={containers.length === 0}>
          + New trigger
        </button>
      </header>

      {error && (
        <div className="view-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="view-loading">
          <div className="view-spinner" />
          <span>Loading triggers…</span>
        </div>
      ) : (
        <>
          <div className="triggers-stats">
            <div className="stat-pill">
              <span className="stat-num">{triggers.length}</span>
              <span className="stat-lbl">Total</span>
            </div>
            <div className="stat-pill stat-linked">
              <span className="stat-num">{linkedCount}</span>
              <span className="stat-lbl">Linked to tags</span>
            </div>
          </div>

          <div className="triggers-controls">
            <select
              className="view-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            >
              <option value="all">All types</option>
              {TRIGGER_TYPES.map(t => (
                <option key={t} value={t}>{TRIGGER_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input
              className="search-input"
              type="search"
              placeholder="Search triggers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {containers.length === 0 ? (
            <div className="view-empty">
              No containers found for your organisation yet — create one before adding triggers.
            </div>
          ) : filteredTriggers.length === 0 ? (
            <div className="view-empty">
              {triggers.length === 0 ? 'No triggers yet.' : 'No triggers match your filter.'}
            </div>
          ) : (
            <div className="triggers-grid">
              {filteredTriggers.map(trigger => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  onEdit={() => openEditModal(trigger)}
                  onDelete={() => handleDelete(trigger)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <TriggerFormModal
          containers={containers}
          initial={editingTrigger}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
