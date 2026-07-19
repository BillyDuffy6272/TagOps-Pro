import { useState, useEffect, useCallback } from 'react'
import {
  getDefaultWorkspace, getTags, getTriggers, triggersById,
  type GtmTag, type GtmTrigger,
} from '../../../lib/gtm'
import { useGtm } from '../../../lib/GtmContext'
import TagCard from '../../../components/TagCard'
import TagDetailModal from '../../../components/TagDetailModal'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatRow from '../../../components/StatRow'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'
import ContainerPicker from '../../../components/ContainerPicker'

type Filter = 'all' | 'active' | 'paused'

export default function TagsView() {
  const { token, selectedAccount, selectedContainer, loadingAccounts, gtmForbidden, setGtmForbidden, error: contextError, clearError, refreshKey } = useGtm()

  const [tags, setTags] = useState<GtmTag[]>([])
  const [triggers, setTriggers] = useState<GtmTrigger[]>([])
  const [detailTag, setDetailTag] = useState<GtmTag | null>(null)

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTags = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const ws = await getDefaultWorkspace(selectedAccount, selectedContainer, token)
      if (!ws) { setTags([]); setTriggers([]); return }
      const [fetchedTags, fetchedTriggers] = await Promise.all([
        getTags(selectedAccount, selectedContainer, ws.workspaceId, token),
        getTriggers(selectedAccount, selectedContainer, ws.workspaceId, token),
      ])
      setTags(fetchedTags)
      setTriggers(fetchedTriggers)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setGtmForbidden(true)
      else setError(e instanceof Error ? e.message : 'Failed to load tags')
    } finally {
      setSyncing(false)
    }
    // refreshKey retriggers the load after a cache-clearing sync
  }, [token, selectedAccount, selectedContainer, setGtmForbidden, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTags() }, [loadTags])

  if (gtmForbidden) return <GtmForbiddenState title="Tags" />

  const filteredTags = tags.filter(tag => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !tag.paused) ||
      (filter === 'paused' && tag.paused)
    const matchesSearch =
      tag.name.toLowerCase().includes(search.toLowerCase()) ||
      tag.type.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const activeCount = tags.filter(t => !t.paused).length
  const pausedCount = tags.filter(t => t.paused).length
  const shownError = error ?? contextError

  return (
    <div className="mx-auto max-w-[1180px] px-10 pt-10 pb-15">
      <ViewHeader title="Tags" subtitle="Live from your GTM container" />

      {shownError && <ErrorBanner message={shownError} onDismiss={() => { setError(null); clearError() }} />}

      <ContainerPicker idPrefix="tags" syncing={syncing} />

      {loadingAccounts ? (
        <LoadingState label="Loading accounts…" />
      ) : (
        <>
          <div className="mb-6">
            <StatRow
              stats={[
                { value: tags.length, label: 'Total' },
                { value: activeCount, label: 'Active', tone: 'success' },
                { value: pausedCount, label: 'Paused', tone: 'warning' },
              ]}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs options={['all', 'active', 'paused']} value={filter} onChange={setFilter} />
            <input
              className="w-[230px] rounded-md border border-border-subtle bg-surface-sunken px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
              type="search"
              placeholder="Search tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {syncing ? (
            <LoadingState label="Syncing tags…" />
          ) : filteredTags.length === 0 ? (
            <EmptyState message={tags.length === 0 ? 'No tags in this container.' : 'No tags match your filter.'} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
              {filteredTags.map(tag => (
                <TagCard key={tag.tagId} tag={tag} onClick={() => setDetailTag(tag)} />
              ))}
            </div>
          )}
        </>
      )}

      {detailTag && (
        <TagDetailModal
          tag={detailTag}
          firingTriggers={triggersById(detailTag.firingTriggerId, triggers)}
          blockingTriggers={triggersById(detailTag.blockingTriggerId, triggers)}
          onClose={() => setDetailTag(null)}
        />
      )}
    </div>
  )
}
