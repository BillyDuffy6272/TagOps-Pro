import { useCallback, useEffect, useState } from 'react'
import { deleteConversionEvent, listContainers, listConversionEvents } from '../api/conversions'
import type { Container, ConversionEventWithContainer } from '../types'
import ConversionCard from './ConversionCard'
import ConversionFormModal from './ConversionFormModal'
import './ConversionsView.css'

type StatusFilter = 'all' | 'active' | 'inactive'

export default function ConversionsView() {
  const [events, setEvents] = useState<ConversionEventWithContainer[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ConversionEventWithContainer | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const [fetchedEvents, fetchedContainers] = await Promise.all([listConversionEvents(), listContainers()])
      setEvents(fetchedEvents)
      setContainers(fetchedContainers)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversion events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreateModal() {
    setEditingEvent(undefined)
    setModalOpen(true)
  }

  function openEditModal(event: ConversionEventWithContainer) {
    setEditingEvent(event)
    setModalOpen(true)
  }

  async function handleDelete(event: ConversionEventWithContainer) {
    if (!window.confirm(`Delete "${event.event_name}"? This can't be undone from here.`)) return
    try {
      await deleteConversionEvent(event.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete conversion event')
    }
  }

  function handleSaved() {
    setModalOpen(false)
    load()
  }

  const filteredEvents = events.filter(e => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && e.is_active) ||
      (statusFilter === 'inactive' && !e.is_active)
    const matchesSearch =
      e.event_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.display_name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const activeCount = events.filter(e => e.is_active).length

  return (
    <div className="conversions-view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Conversions</h1>
          <p className="view-sub">GA4 conversion events</p>
        </div>
        <button className="new-conversion-btn" onClick={openCreateModal} disabled={containers.length === 0}>
          + New conversion event
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
          <span>Loading conversion events…</span>
        </div>
      ) : (
        <>
          <div className="conversions-stats">
            <div className="stat-pill">
              <span className="stat-num">{events.length}</span>
              <span className="stat-lbl">Total</span>
            </div>
            <div className="stat-pill stat-active">
              <span className="stat-num">{activeCount}</span>
              <span className="stat-lbl">Active</span>
            </div>
          </div>

          <div className="conversions-controls">
            <div className="filter-tabs">
              {(['all', 'active', 'inactive'] as StatusFilter[]).map(f => (
                <button
                  key={f}
                  className={`filter-tab${statusFilter === f ? ' filter-tab-active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <input
              className="search-input"
              type="search"
              placeholder="Search conversion events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {containers.length === 0 ? (
            <div className="view-empty">
              No containers found for your organisation yet — create one before adding conversion events.
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="view-empty">
              {events.length === 0 ? 'No conversion events yet.' : 'No conversion events match your filter.'}
            </div>
          ) : (
            <div className="conversions-grid">
              {filteredEvents.map(event => (
                <ConversionCard
                  key={event.id}
                  event={event}
                  onEdit={() => openEditModal(event)}
                  onDelete={() => handleDelete(event)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <ConversionFormModal
          containers={containers}
          initial={editingEvent}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
