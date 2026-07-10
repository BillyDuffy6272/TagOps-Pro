import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  getAccounts, getContainers, getWorkspaces, getTriggers, getTags,
  tagsUsingTrigger, triggerLabel,
  type GtmAccount, type GtmContainer, type GtmTrigger, type GtmTag,
} from '../../../lib/gtm'
import TriggerCard from './TriggerCard'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatPill from '../../../components/StatPill'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'

type Filter = 'all' | 'linked' | 'unlinked'

interface Props {
  session: Session
}

const SELECT_CLASSES =
  'min-w-[160px] cursor-pointer rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

export default function TriggersView({ session }: Props) {
  const [accounts, setAccounts] = useState<GtmAccount[]>([])
  const [containers, setContainers] = useState<GtmContainer[]>([])
  const [triggers, setTriggers] = useState<GtmTrigger[]>([])
  const [tags, setTags] = useState<GtmTag[]>([])

  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedContainer, setSelectedContainer] = useState('')

  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
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
    setTriggers([])
    setTags([])
    getContainers(selectedAccount, token)
      .then(ctrs => {
        setContainers(ctrs)
        if (ctrs.length > 0) setSelectedContainer(ctrs[0].containerId)
      })
      .catch(e => setError(e.message))
  }, [token, selectedAccount])

  const loadTriggers = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const workspaces = await getWorkspaces(selectedAccount, selectedContainer, token)
      const ws = workspaces[0]
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
  }, [token, selectedAccount, selectedContainer])

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

  return (
    <div className="mx-auto max-w-[1200px] px-10 pt-11 pb-15">
      <ViewHeader title="Triggers" subtitle="Live from your GTM container" />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mb-7 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="trigger-account-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Account</label>
          <select
            id="trigger-account-select"
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
          <label htmlFor="trigger-container-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Container</label>
          <select
            id="trigger-container-select"
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
          className="flex items-center gap-1.5 self-end rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
          onClick={loadTriggers}
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
          <div className="mb-6 flex flex-wrap gap-2">
            <StatPill value={triggers.length} label="Total" />
            <StatPill value={linkedCount} label="Linked to tags" tone="success" />
            <StatPill value={unlinkedCount} label="Unlinked" tone="warning" />
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
              className="w-[210px] rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
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
