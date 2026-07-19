import type { ReactNode } from 'react'
import { useGtm } from '../lib/GtmContext'

interface Props {
  idPrefix: string
  syncing: boolean
  syncLabel?: string
  syncingLabel?: string
  children?: ReactNode
}

const SELECT_CLASSES =
  'min-w-[160px] cursor-pointer rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-1.5 text-[13px] text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-35'

// The account/container picker bar shared by every GTM-backed view.
// Selection lives in GtmContext so it survives switching views; the sync
// button clears the GTM API cache and refetches everything that depends on it.
export default function ContainerPicker({ idPrefix, syncing, syncLabel = 'Sync', syncingLabel = 'Syncing…', children }: Props) {
  const { accounts, containers, selectedAccount, selectedContainer, setSelectedAccount, setSelectedContainer, loadingAccounts, refresh } = useGtm()

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface-sunken/70 p-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-account-select`} className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Account</label>
        <select
          id={`${idPrefix}-account-select`}
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
        <label htmlFor={`${idPrefix}-container-select`} className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase">Container</label>
        <select
          id={`${idPrefix}-container-select`}
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
        onClick={refresh}
        disabled={syncing || !selectedContainer}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {syncing ? syncingLabel : syncLabel}
      </button>

      {children}
    </div>
  )
}
