import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import {
  getAccounts, getContainers, getWorkspaces, getTriggers, getTags,
  tagsUsingTrigger, triggerLabel,
  type GtmAccount, type GtmContainer, type GtmTrigger, type GtmTag,
} from '../../../lib/gtm'
import TriggerCard from './TriggerCard'
import './TriggersView.css'

type Filter = 'all' | 'linked' | 'unlinked'

interface Props {
  session: Session
}

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

  if (gtmForbidden) {
    return (
      <div className="triggers-view">
        <header className="view-header">
          <h1 className="view-title">Triggers</h1>
        </header>
        <div className="forbidden-state">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <p className="forbidden-title">GTM access denied (403)</p>
          <p className="forbidden-body">
            Either the <strong>Tag Manager API</strong> is not enabled in your Google Cloud project,
            or the GTM read permission wasn't granted during sign-in.
          </p>
          <ul className="forbidden-steps">
            <li>Enable the API at <em>console.cloud.google.com → APIs &amp; Services → Tag Manager API</em></li>
            <li>Re-grant scope: sign out and sign in again, accepting the Tag Manager permission</li>
          </ul>
          <button className="forbidden-signout" onClick={() => supabase.auth.signOut()}>
            Sign out and try again
          </button>
        </div>
      </div>
    )
  }

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
    <div className="triggers-view">
      <header className="view-header">
        <h1 className="view-title">Triggers</h1>
        <p className="view-sub">Live from your GTM container</p>
      </header>

      {error && (
        <div className="view-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="triggers-selectors">
        <div className="select-group">
          <label htmlFor="trigger-account-select" className="select-label">Account</label>
          <select
            id="trigger-account-select"
            className="view-select"
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

        <div className="select-group">
          <label htmlFor="trigger-container-select" className="select-label">Container</label>
          <select
            id="trigger-container-select"
            className="view-select"
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
          className="sync-btn"
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
        <div className="view-loading">
          <div className="view-spinner" />
          <span>Loading accounts…</span>
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
            <div className="stat-pill stat-unlinked">
              <span className="stat-num">{unlinkedCount}</span>
              <span className="stat-lbl">Unlinked</span>
            </div>
          </div>

          <div className="triggers-controls">
            <div className="filter-tabs">
              {(['all', 'linked', 'unlinked'] as Filter[]).map(f => (
                <button
                  key={f}
                  className={`filter-tab${filter === f ? ' filter-tab-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select
              className="view-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{triggerLabel(t)}</option>
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

          {syncing ? (
            <div className="view-loading">
              <div className="view-spinner" />
              <span>Syncing triggers…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="view-empty">
              {triggers.length === 0 ? 'No triggers in this container.' : 'No triggers match your filter.'}
            </div>
          ) : (
            <div className="triggers-grid">
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
