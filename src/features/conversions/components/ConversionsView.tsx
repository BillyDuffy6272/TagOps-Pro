import { useCallback, useEffect, useState } from 'react'
import { deleteConversionEvent, listContainers, listConversionEvents } from '../api/conversions'
import type { Container, ConversionEventWithContainer } from '../types'
import ConversionCard from './ConversionCard'
import ConversionFormModal from './ConversionFormModal'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatPill from '../../../components/StatPill'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'

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
    <div className="mx-auto max-w-[1200px] px-10 pt-11 pb-15">
      <ViewHeader
        title="Conversions"
        subtitle="GA4 conversion events"
        action={
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
            onClick={openCreateModal}
            disabled={containers.length === 0}
          >
            + New conversion event
          </button>
        }
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingState label="Loading conversion events…" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <StatPill value={events.length} label="Total" />
            <StatPill value={activeCount} label="Active" tone="success" />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs options={['all', 'active', 'inactive']} value={statusFilter} onChange={setStatusFilter} />
            <input
              className="w-[210px] rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
              type="search"
              placeholder="Search conversion events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {containers.length === 0 ? (
            <EmptyState message="No containers found for your organisation yet — create one before adding conversion events." />
          ) : filteredEvents.length === 0 ? (
            <EmptyState message={events.length === 0 ? 'No conversion events yet.' : 'No conversion events match your filter.'} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
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
