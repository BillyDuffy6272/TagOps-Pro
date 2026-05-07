import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  getAccounts, getContainers, getWorkspaces, getTags,
  type GtmAccount, type GtmContainer, type GtmTag,
} from '../lib/gtm'
import TagCard from '../components/TagCard'
import './Dashboard.css'

type Filter = 'all' | 'active' | 'paused'

interface Props {
  session: Session
}

export default function Dashboard({ session }: Props) {
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

  const token = session.provider_token
  const user = session.user
  const userName = user.user_metadata?.full_name ?? user.email ?? 'User'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  useEffect(() => {
    if (!token) return
    setLoadingAccounts(true)
    getAccounts(token)
      .then(accs => {
        setAccounts(accs)
        if (accs.length > 0) setSelectedAccount(accs[0].accountId)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingAccounts(false))
  }, [token])

  useEffect(() => {
    if (!token || !selectedAccount) return
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
    if (!token || !selectedAccount || !selectedContainer) return
    setSyncing(true)
    setError(null)
    try {
      const workspaces = await getWorkspaces(selectedAccount, selectedContainer, token)
      const ws = workspaces[0]
      if (!ws) { setTags([]); return }
      const fetched = await getTags(selectedAccount, selectedContainer, ws.workspaceId, token)
      setTags(fetched)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tags')
    } finally {
      setSyncing(false)
    }
  }, [token, selectedAccount, selectedContainer])

  useEffect(() => { loadTags() }, [loadTags])

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

  if (!token) {
    return (
      <div className="token-expired">
        <p>Your Google session has expired. Please sign in again.</p>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#818CF8" />
            <polygon points="18,8 28,14 28,26 18,32 8,26 8,14" fill="#312E81" />
            <circle cx="18" cy="18" r="4" fill="#C7D2FE" />
          </svg>
          <span className="logo-text">TagOps Pro</span>
        </div>
        <div className="dash-user">
          {avatarUrl && <img src={avatarUrl} alt="" className="avatar" />}
          <span className="user-name">{userName}</span>
          <button className="sign-out-btn" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        {error && (
          <div className="error-banner">
            <span><strong>Error:</strong> {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="selectors-row">
          <div className="selector-group">
            <label htmlFor="account-select">Account</label>
            <select
              id="account-select"
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

          <div className="selector-group">
            <label htmlFor="container-select">Container</label>
            <select
              id="container-select"
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>

        {loadingAccounts ? (
          <div className="loading-state">
            <div className="spinner" />
            Loading your GTM accounts…
          </div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-num">{tags.length}</span>
                <span className="stat-label">Total Tags</span>
              </div>
              <div className="stat-card stat-active">
                <span className="stat-num">{activeCount}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-card stat-paused">
                <span className="stat-num">{pausedCount}</span>
                <span className="stat-label">Paused</span>
              </div>
            </div>

            <div className="controls-row">
              <div className="filter-tabs">
                {(['all', 'active', 'paused'] as Filter[]).map(f => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? 'selected' : ''}`}
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
              <div className="loading-state">
                <div className="spinner" />
                Syncing tags…
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="empty-state">
                {tags.length === 0
                  ? 'No tags found in this container.'
                  : 'No tags match your filter.'}
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
      </main>
    </div>
  )
}
