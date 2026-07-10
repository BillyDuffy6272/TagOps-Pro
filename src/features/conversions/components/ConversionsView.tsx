import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getAccounts, getContainers, type GtmAccount, type GtmContainer } from '../../../lib/gtm'
import {
  deleteConversionEvent,
  ensureContainerForGtmContainer,
  getCurrentOrganisationId,
  listConversionEventsForContainer,
} from '../api/conversions'
import { CONVERSION_CATEGORIES, type Container, type ConversionCategory, type ConversionEventWithContainer } from '../types'
import ConversionTableRow from './ConversionTableRow'
import ConversionFormModal from './ConversionFormModal'
import CategoryBadge from '../../../components/CategoryBadge'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatRow from '../../../components/StatRow'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'

type StatusFilter = 'all' | 'active' | 'inactive'

interface Props {
  session: Session
}

const SELECT_CLASSES =
  'min-w-[160px] cursor-pointer rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

export default function ConversionsView({ session }: Props) {
  const [accounts, setAccounts] = useState<GtmAccount[]>([])
  const [gtmContainers, setGtmContainers] = useState<GtmContainer[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedContainer, setSelectedContainer] = useState('')

  const [organisationId, setOrganisationId] = useState<string | null>(null)
  const [resolvedContainer, setResolvedContainer] = useState<Container | null>(null)
  const [events, setEvents] = useState<ConversionEventWithContainer[]>([])

  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gtmForbidden, setGtmForbidden] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ConversionEventWithContainer | undefined>(undefined)

  const [collapsedCategories, setCollapsedCategories] = useState<Set<ConversionCategory>>(new Set())

  const token = session.provider_token!  // guaranteed non-null by Dashboard gate

  useEffect(() => {
    getCurrentOrganisationId(session.user.id)
      .then(setOrganisationId)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to resolve organisation'))
  }, [session.user.id])

  useEffect(() => {
    setLoadingAccounts(true)
    getAccounts(token)
      .then(accs => {
        setAccounts(accs)
        if (accs.length > 0) setSelectedAccount(accs[0].accountId)
      })
      .catch(e => {
        if ((e as { status?: number }).status === 403) setGtmForbidden(true)
        else setError(e.message)
      })
      .finally(() => setLoadingAccounts(false))
  }, [token])

  useEffect(() => {
    if (!selectedAccount) return
    setGtmContainers([])
    setSelectedContainer('')
    setResolvedContainer(null)
    setEvents([])
    getContainers(selectedAccount, token)
      .then(ctrs => {
        setGtmContainers(ctrs)
        if (ctrs.length > 0) setSelectedContainer(ctrs[0].containerId)
      })
      .catch(e => setError(e.message))
  }, [token, selectedAccount])

  const loadConversions = useCallback(async () => {
    if (!organisationId || !selectedContainer) return
    const gtmContainer = gtmContainers.find(c => c.containerId === selectedContainer)
    if (!gtmContainer) return
    setSyncing(true)
    setError(null)
    try {
      const container = await ensureContainerForGtmContainer(organisationId, {
        name: gtmContainer.name,
        publicId: gtmContainer.publicId,
      })
      setResolvedContainer(container)
      const fetchedEvents = await listConversionEventsForContainer(container.id)
      setEvents(fetchedEvents)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversion events')
    } finally {
      setSyncing(false)
    }
  }, [organisationId, selectedContainer, gtmContainers])

  useEffect(() => { loadConversions() }, [loadConversions])

  function toggleCategory(category: ConversionCategory) {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

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
      await loadConversions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete conversion event')
    }
  }

  function handleSaved() {
    setModalOpen(false)
    loadConversions()
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

  const groupedEvents = useMemo(() => {
    return CONVERSION_CATEGORIES
      .map(({ value, label }) => ({
        category: value,
        label,
        events: filteredEvents.filter(e => e.category === value),
      }))
      .filter(group => group.events.length > 0)
  }, [filteredEvents])

  if (gtmForbidden) return <GtmForbiddenState title="Conversions" />

  return (
    <div className="mx-auto max-w-[1180px] px-10 pt-10 pb-15">
      <ViewHeader
        title="Conversions"
        subtitle="GA4 and Google Ads conversion events, by container"
        action={
          <button
            type="button"
            className="rounded-md border border-white/10 bg-surface-raised px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-text-primary transition-colors duration-150 ease-out hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
            onClick={openCreateModal}
            disabled={!resolvedContainer}
          >
            + New conversion event
          </button>
        }
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface-sunken/70 p-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="conversion-account-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Account</label>
          <select
            id="conversion-account-select"
            className={SELECT_CLASSES}
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            disabled={loadingAccounts || accounts.length === 0}
          >
            {accounts.length === 0 && <option>No accounts found</option>}
            {accounts.map(acc => (
              <option key={acc.accountId} value={acc.accountId}>{acc.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="conversion-container-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Container</label>
          <select
            id="conversion-container-select"
            className={SELECT_CLASSES}
            value={selectedContainer}
            onChange={e => setSelectedContainer(e.target.value)}
            disabled={gtmContainers.length === 0}
          >
            {gtmContainers.length === 0 && <option>No containers</option>}
            {gtmContainers.map(c => (
              <option key={c.containerId} value={c.containerId}>
                {c.name} ({c.publicId})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 self-end rounded-md border border-white/10 bg-surface-raised px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-text-primary transition-colors duration-150 ease-out hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
          onClick={loadConversions}
          disabled={syncing || !selectedContainer}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {syncing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loadingAccounts ? (
        <LoadingState label="Loading accounts…" />
      ) : (
        <>
          <div className="mb-6">
            <StatRow
              stats={[
                { value: events.length, label: 'Total' },
                { value: activeCount, label: 'Active', tone: 'success' },
              ]}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs options={['all', 'active', 'inactive']} value={statusFilter} onChange={setStatusFilter} />
            <input
              className="w-[230px] rounded-md border border-border-subtle bg-surface-sunken px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
              type="search"
              placeholder="Search conversion events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {gtmContainers.length === 0 ? (
            <EmptyState message="No containers in this GTM account." />
          ) : syncing ? (
            <LoadingState label="Loading conversion events…" />
          ) : filteredEvents.length === 0 ? (
            <EmptyState message={events.length === 0 ? 'No conversion events yet for this container.' : 'No conversion events match your filter.'} />
          ) : (
            <div className="flex flex-col gap-4">
              {groupedEvents.map(group => {
                const collapsed = collapsedCategories.has(group.category)
                const activeInGroup = group.events.filter(e => e.is_active).length
                const needsSetup = group.events.some(e => e.conversion_label && !e.containerGoogleAdsConversionId)
                return (
                  <div key={group.category} className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      onClick={() => toggleCategory(group.category)}
                      aria-expanded={!collapsed}
                    >
                      <span className="flex items-center gap-2.5">
                        <svg
                          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                          className={`shrink-0 text-text-faint transition-transform duration-150 ease-out ${collapsed ? '-rotate-90' : ''}`}
                          aria-hidden="true"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                        <CategoryBadge kind="conversion" category={group.category} label={group.label} />
                      </span>
                      <span className="flex items-center gap-3 text-[11px] text-text-faint">
                        <span>{group.events.length} event{group.events.length === 1 ? '' : 's'}</span>
                        <span>{activeInGroup} active</span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ${needsSetup ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                          {needsSetup ? 'Needs setup' : 'Ready'}
                        </span>
                      </span>
                    </button>
                    {!collapsed && (
                      <div className="overflow-x-auto border-t border-border-subtle">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
                              <th className="px-4 py-2">Conversion action</th>
                              <th className="px-4 py-2">Ads ID / Label</th>
                              <th className="px-4 py-2">Value</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.events.map(event => (
                              <ConversionTableRow
                                key={event.id}
                                event={event}
                                onEdit={() => openEditModal(event)}
                                onDelete={() => handleDelete(event)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {modalOpen && resolvedContainer && (
        <ConversionFormModal
          container={resolvedContainer}
          initial={editingEvent}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
