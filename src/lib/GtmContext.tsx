import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { clearGtmCache, getAccounts, getContainers, type GtmAccount, type GtmContainer } from './gtm'

// Account/container selection used to live separately in every view, so
// switching sidebar sections dropped the user's selection and refetched the
// same lists. This context owns the selection once, app-wide.
interface GtmContextValue {
  token: string
  accounts: GtmAccount[]
  containers: GtmContainer[]
  selectedAccount: string
  selectedContainer: string
  setSelectedAccount: (id: string) => void
  setSelectedContainer: (id: string) => void
  selectedGtmContainer: GtmContainer | null
  loadingAccounts: boolean
  gtmForbidden: boolean
  setGtmForbidden: (forbidden: boolean) => void
  error: string | null
  clearError: () => void
  // Incremented by refresh(); views include it in their load deps to refetch.
  refreshKey: number
  refresh: () => void
}

const GtmContext = createContext<GtmContextValue | null>(null)

interface Props {
  session: Session
  children: ReactNode
}

export function GtmProvider({ session, children }: Props) {
  const token = session.provider_token!  // guaranteed non-null by Dashboard gate

  const [accounts, setAccounts] = useState<GtmAccount[]>([])
  const [containers, setContainers] = useState<GtmContainer[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedContainer, setSelectedContainer] = useState('')
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [gtmForbidden, setGtmForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoadingAccounts(true)
    getAccounts(token)
      .then(accs => {
        setAccounts(accs)
        setSelectedAccount(prev => (prev && accs.some(a => a.accountId === prev) ? prev : (accs[0]?.accountId ?? '')))
      })
      .catch(e => {
        if ((e as { status?: number }).status === 403) setGtmForbidden(true)
        else setError(e instanceof Error ? e.message : 'Failed to load GTM accounts')
      })
      .finally(() => setLoadingAccounts(false))
  }, [token, refreshKey])

  useEffect(() => {
    if (!selectedAccount) return
    getContainers(selectedAccount, token)
      .then(ctrs => {
        setContainers(ctrs)
        setSelectedContainer(prev => (prev && ctrs.some(c => c.containerId === prev) ? prev : (ctrs[0]?.containerId ?? '')))
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load containers'))
  }, [token, selectedAccount, refreshKey])

  const refresh = useCallback(() => {
    clearGtmCache()
    setError(null)
    setRefreshKey(k => k + 1)
  }, [])

  const selectedGtmContainer = useMemo(
    () => containers.find(c => c.containerId === selectedContainer) ?? null,
    [containers, selectedContainer]
  )

  const value = useMemo<GtmContextValue>(() => ({
    token,
    accounts,
    containers,
    selectedAccount,
    selectedContainer,
    setSelectedAccount,
    setSelectedContainer,
    selectedGtmContainer,
    loadingAccounts,
    gtmForbidden,
    setGtmForbidden,
    error,
    clearError: () => setError(null),
    refreshKey,
    refresh,
  }), [token, accounts, containers, selectedAccount, selectedContainer, selectedGtmContainer, loadingAccounts, gtmForbidden, error, refreshKey, refresh])

  return <GtmContext.Provider value={value}>{children}</GtmContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook and provider belong together
export function useGtm(): GtmContextValue {
  const ctx = useContext(GtmContext)
  if (!ctx) throw new Error('useGtm must be used inside <GtmProvider>')
  return ctx
}
