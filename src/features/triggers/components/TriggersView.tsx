import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getDefaultWorkspace, getTriggers, getTags,
  tagsUsingTrigger, triggerLabel,
  type GtmTrigger, type GtmTag,
} from '../../../lib/gtm'
import { useGtm } from '../../../lib/GtmContext'
import TriggerCard from './TriggerCard'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatRow from '../../../components/StatRow'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'
import ContainerPicker from '../../../components/ContainerPicker'

type Filter = 'all' | 'linked' | 'unlinked'

const SELECT_CLASSES =
  'min-w-[160px] cursor-pointer rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

export default function TriggersView() {
  const { token, selectedAccount, selectedContainer, loadingAccounts, gtmForbidden, setGtmForbidden, error: contextError, clearError, refreshKey } = useGtm()

  const [triggers, setTriggers] = useState<GtmTrigger[]>([])
  const [tags, setTags] = useState<GtmTag[]>([])

  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTriggers = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const ws = await getDefaultWorkspace(selectedAccount, selectedContainer, token)
      if (!ws) { setTriggers([]); setTags([]); return }
      const [fetchedTriggers, fetchedTags] = await Promise.all([
        getTriggers(selectedAccount, selectedContainer, ws.workspaceId, token),
        getTags(selectedAccount, selectedContainer, ws.workspaceId, token),
      ])
      setTriggers(fetchedTriggers)
      setTags(fetchedTags)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setGtmForbidden(true)
      else setError(e instanceof Error ? e.message : 'Failed to load triggers')
    } finally {
      setSyncing(false)
    }
    // refreshKey retriggers the load after a cache-clearing sync
  }, [token, selectedAccount, selectedContainer, setGtmForbidden, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTriggers() }, [loadTriggers])

  const triggersWithUsage = useMemo(
    () => triggers.map(trigger => ({
      trigger,
      usage: tagsUsingTrigger(trigger.triggerId, tags),
    })),
    [triggers, tags]
  )

  const availableTypes = useMemo(() => [...new Set(triggers.map(t => t.type))], [triggers])

  if (gtmForbidden) return <GtmForbiddenState title="Triggers" />

  const filtered = triggersWithUsage.filter(({ trigger, usage }) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'linked' && usage.length > 0) ||
      (filter === 'unlinked' && usage.length === 0)
    const matchesType = typeFilter === 'all' || trigger.type === typeFilter
    const matchesSearch =
      trigger.name.toLowerCase().includes(search.toLowerCase()) ||
      trigger.type.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesType && matchesSearch
  })

  const linkedCount = triggersWithUsage.filter(t => t.usage.length > 0).length
  const unlinkedCount = triggersWithUsage.length - linkedCount
  const shownError = error ?? contextError

  return (
    <div className="mx-auto max-w-[1180px] px-10 pt-10 pb-15">
      <ViewHeader title="Triggers" subtitle="Live from your GTM container" />

      {shownError && <ErrorBanner message={shownError} onDismiss={() => { setError(null); clearError() }} />}

      <ContainerPicker idPrefix="trigger" syncing={syncing} />

      {loadingAccounts ? (
        <LoadingState label="Loading accounts…" />
      ) : (
        <>
          <div className="mb-6">
            <StatRow
              stats={[
                { value: triggers.length, label: 'Total' },
                { value: linkedCount, label: 'Linked to tags', tone: 'success' },
                { value: unlinkedCount, label: 'Unlinked', tone: 'warning' },
              ]}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs options={['all', 'linked', 'unlinked']} value={filter} onChange={setFilter} />
            <select
              className={SELECT_CLASSES}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{triggerLabel(t)}</option>
              ))}
            </select>
            <input
              className="w-[230px] rounded-md border border-border-subtle bg-surface-sunken px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
              type="search"
              placeholder="Search triggers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {syncing ? (
            <LoadingState label="Syncing triggers…" />
          ) : filtered.length === 0 ? (
            <EmptyState message={triggers.length === 0 ? 'No triggers in this container.' : 'No triggers match your filter.'} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
              {filtered.map(({ trigger, usage }) => (
                <TriggerCard key={trigger.triggerId} trigger={trigger} usedByTags={usage} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
