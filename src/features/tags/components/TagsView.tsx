import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  getAccounts, getContainers, getWorkspaces, getTags, getTriggers, triggersById,
  type GtmAccount, type GtmContainer, type GtmTag, type GtmTrigger,
} from '../../../lib/gtm'
import TagCard from '../../../components/TagCard'
import TagDetailModal from '../../../components/TagDetailModal'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatRow from '../../../components/StatRow'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'

type Filter = 'all' | 'active' | 'paused'

interface Props {
  session: Session
}

const SELECT_CLASSES =
  'min-w-[200px] cursor-pointer rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

export default function TagsView({ session }: Props) {
  const [accounts, setAccounts] = useState<GtmAccount[]>([])
  const [containers, setContainers] = useState<GtmContainer[]>([])
  const [tags, setTags] = useState<GtmTag[]>([])
  const [triggers, setTriggers] = useState<GtmTrigger[]>([])
  const [detailTag, setDetailTag] = useState<GtmTag | null>(null)

  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedContainer, setSelectedContainer] = useState('')

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gtmForbidden, setGtmForbidden] = useState(false)

  const token = session.provider_token!  // guaranteed non-null by Dashboard gate

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
    setContainers([])
    setSelectedContainer('')
    setTags([])
    setTriggers([])
    getContainers(selectedAccount, token)
      .then(ctrs => {
        setContainers(ctrs)
        if (ctrs.length > 0) setSelectedContainer(ctrs[0].containerId)
      })
      .catch(e => setError(e.message))
  }, [token, selectedAccount])

  const loadTags = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const workspaces = await getWorkspaces(selectedAccount, selectedContainer, token)
      const ws = workspaces[0]
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
  }, [token, selectedAccount, selectedContainer])

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

  return (
    <div className="mx-auto max-w-[1180px] px-10 pt-10 pb-15">
      <ViewHeader title="Tags" subtitle="Live from your GTM container" />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface-sunken/70 p-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Account</label>
          <select
            id="account-select"
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
          <label htmlFor="container-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Container</label>
          <select
            id="container-select"
            className={SELECT_CLASSES}
            value={selectedContainer}
            onChange={e => setSelectedContainer(e.target.value)}
            disabled={containers.length === 0}
          >
            {containers.length === 0 && <option>No containers</option>}
            {containers.map(c => (
              <option key={c.containerId} value={c.containerId}>
                {c.name} ({c.publicId})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 self-end rounded-md border border-white/10 bg-surface-raised px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-text-primary transition-colors duration-150 ease-out hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
          onClick={loadTags}
          disabled={syncing || !selectedContainer}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

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
