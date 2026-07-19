import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getDefaultWorkspace, getVariables, getTags,
  tagsUsingVariable, variableLabel,
  type GtmVariable, type GtmTag,
} from '../../../lib/gtm'
import { useGtm } from '../../../lib/GtmContext'
import VariableCard from './VariableCard'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import StatRow from '../../../components/StatRow'
import FilterTabs from '../../../components/FilterTabs'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import GtmForbiddenState from '../../../components/GtmForbiddenState'
import ContainerPicker from '../../../components/ContainerPicker'

type Filter = 'all' | 'used' | 'unused'

const SELECT_CLASSES =
  'min-w-[160px] cursor-pointer rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

export default function VariablesView() {
  const { token, selectedAccount, selectedContainer, loadingAccounts, gtmForbidden, setGtmForbidden, error: contextError, clearError, refreshKey } = useGtm()

  const [variables, setVariables] = useState<GtmVariable[]>([])
  const [tags, setTags] = useState<GtmTag[]>([])

  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadVariables = useCallback(async () => {
    if (!selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const ws = await getDefaultWorkspace(selectedAccount, selectedContainer, token)
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
    // refreshKey retriggers the load after a cache-clearing sync
  }, [token, selectedAccount, selectedContainer, setGtmForbidden, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const shownError = error ?? contextError

  return (
    <div className="mx-auto max-w-[1180px] px-10 pt-10 pb-15">
      <ViewHeader title="Variables" subtitle="Live from your GTM container" />

      {shownError && <ErrorBanner message={shownError} onDismiss={() => { setError(null); clearError() }} />}

      <ContainerPicker idPrefix="variable" syncing={syncing} />

      {loadingAccounts ? (
        <LoadingState label="Loading accounts…" />
      ) : (
        <>
          <div className="mb-6">
            <StatRow
              stats={[
                { value: variables.length, label: 'Total' },
                { value: usedCount, label: 'Used in tags', tone: 'success' },
                { value: unusedCount, label: 'Unused', tone: 'warning' },
              ]}
            />
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
              className="w-[230px] rounded-md border border-border-subtle bg-surface-sunken px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out placeholder:text-text-faint hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
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
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
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
