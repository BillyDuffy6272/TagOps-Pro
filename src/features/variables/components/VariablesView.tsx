import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  getAccounts, getContainers, getWorkspaces, getVariables, getTags,
  tagsUsingVariable, variableLabel,
  type GtmAccount, type GtmContainer, type GtmVariable, type GtmTag,
} from '../../../lib/gtm'
import VariableCard from './VariableCard'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatPill from '../../../components/StatPill'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'

type Filter = 'all' | 'used' | 'unused'

interface Props {
  session: Session
}

const SELECT_CLASSES =
  'min-w-[160px] cursor-pointer rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

export default function VariablesView({ session }: Props) {
  const [accounts, setAccounts] = useState<GtmAccount[]>([])
  const [containers, setContainers] = useState<GtmContainer[]>([])
  const [variables, setVariables] = useState<GtmVariable[]>([])
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
    setVariables([])
    setTags([])
    getContainers(selectedAccount, token)
      .then(ctrs => {
        setContainers(ctrs)
        if (ctrs.length > 0) setSelectedContainer(ctrs[0].containerId)
      })
      .catch(e => setError(e.message))
  }, [token, selectedAccount])

  const loadVariables = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const workspaces = await getWorkspaces(selectedAccount, selectedContainer, token)
      const ws = workspaces[0]
      if (!ws) { setVariables([]); setTags([]); return }
      const [fetchedVariables, fetchedTags] = await Promise.all([
        getVariables(selectedAccount, selectedContainer, ws.workspaceId, token),
        getTags(selectedAccount, selectedContainer, ws.workspaceId, token),
      ])
      setVariables(fetchedVariables)
      setTags(fetchedTags)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setGtmForbidden(true)
      else setError(e instanceof Error ? e.message : 'Failed to load variables')
    } finally {
      setSyncing(false)
    }
  }, [token, selectedAccount, selectedContainer])

  useEffect(() => { loadVariables() }, [loadVariables])

  const variablesWithUsage = useMemo(
    () => variables.map(variable => ({
      variable,
      usage: tagsUsingVariable(variable.name, tags),
    })),
    [variables, tags]
  )

  const availableTypes = useMemo(() => [...new Set(variables.map(v => v.type))], [variables])

  if (gtmForbidden) return <GtmForbiddenState title="Variables" />

  const filtered = variablesWithUsage.filter(({ variable, usage }) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'used' && usage.length > 0) ||
      (filter === 'unused' && usage.length === 0)
    const matchesType = typeFilter === 'all' || variable.type === typeFilter
    const matchesSearch = variable.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesType && matchesSearch
  })

  const usedCount = variablesWithUsage.filter(v => v.usage.length > 0).length
  const unusedCount = variablesWithUsage.length - usedCount

  return (
    <div className="mx-auto max-w-[1200px] px-10 pt-11 pb-15">
      <ViewHeader title="Variables" subtitle="Live from your GTM container" />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mb-7 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="variable-account-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Account</label>
          <select
            id="variable-account-select"
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
          <label htmlFor="variable-container-select" className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Container</label>
          <select
            id="variable-container-select"
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
          onClick={loadVariables}
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
            <StatPill value={variables.length} label="Total" />
            <StatPill value={usedCount} label="Used in tags" tone="success" />
            <StatPill value={unusedCount} label="Unused" tone="warning" />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs options={['all', 'used', 'unused']} value={filter} onChange={setFilter} />
            <select
              className={SELECT_CLASSES}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{variableLabel(t)}</option>
              ))}
            </select>
            <input
              className="w-[210px] rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
              type="search"
              placeholder="Search variables…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {syncing ? (
            <LoadingState label="Syncing variables…" />
          ) : filtered.length === 0 ? (
            <EmptyState message={variables.length === 0 ? 'No variables in this container.' : 'No variables match your filter.'} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
              {filtered.map(({ variable, usage }) => (
                <VariableCard key={variable.variableId} variable={variable} usedByTags={usage} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
