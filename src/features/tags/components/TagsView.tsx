import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import {
  getAccounts, getContainers, getWorkspaces, getTags,
  type GtmAccount, type GtmContainer, type GtmTag,
} from '../../../lib/gtm'
import TagCard from '../../../components/TagCard'
import './TagsView.css'

type Filter = 'all' | 'active' | 'paused'

interface Props {
  session: Session
}

export default function TagsView({ session }: Props) {
  const [accounts, setAccounts] = useState<GtmAccount[]>([])
  const [containers, setContainers] = useState<GtmContainer[]>([])
  const [tags, setTags] = useState<GtmTag[]>([])

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
      if (!ws) { setTags([]); return }
      const fetched = await getTags(selectedAccount, selectedContainer, ws.workspaceId, token)
      setTags(fetched)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setGtmForbidden(true)
      else setError(e instanceof Error ? e.message : 'Failed to load tags')
    } finally {
      setSyncing(false)
    }
  }, [token, selectedAccount, selectedContainer])

  useEffect(() => { loadTags() }, [loadTags])

  if (gtmForbidden) {
    return (
      <div className="tags-view">
        <header className="view-header">
          <h1 className="view-title">Tags</h1>
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
    <div className="tags-view">
      <header className="view-header">
        <h1 className="view-title">Tags</h1>
        <p className="view-sub">Live from your GTM container</p>
      </header>

      {error && (
        <div className="view-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="tags-selectors">
        <div className="select-group">
          <label htmlFor="account-select" className="select-label">Account</label>
          <select
            id="account-select"
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
          <label htmlFor="container-select" className="select-label">Container</label>
          <select
            id="container-select"
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
        <div className="view-loading">
          <div className="view-spinner" />
          <span>Loading accounts…</span>
        </div>
      ) : (
        <>
          <div className="tags-stats">
            <div className="stat-pill">
              <span className="stat-num">{tags.length}</span>
              <span className="stat-lbl">Total</span>
            </div>
            <div className="stat-pill stat-active">
              <span className="stat-num">{activeCount}</span>
              <span className="stat-lbl">Active</span>
            </div>
            <div className="stat-pill stat-paused">
              <span className="stat-num">{pausedCount}</span>
              <span className="stat-lbl">Paused</span>
            </div>
          </div>

          <div className="tags-controls">
            <div className="filter-tabs">
              {(['all', 'active', 'paused'] as Filter[]).map(f => (
                <button
                  key={f}
                  className={`filter-tab${filter === f ? ' filter-tab-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <input
              className="search-input"
              type="search"
              placeholder="Search tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {syncing ? (
            <div className="view-loading">
              <div className="view-spinner" />
              <span>Syncing tags…</span>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="view-empty">
              {tags.length === 0 ? 'No tags in this container.' : 'No tags match your filter.'}
            </div>
          ) : (
            <div className="tags-grid">
              {filteredTags.map(tag => (
                <TagCard key={tag.tagId} tag={tag} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
