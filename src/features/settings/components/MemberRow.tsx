import { useState } from 'react'
import { removeOrganisationMember, updateOrganisationMember } from '../api/settings'
import { ASSIGNABLE_ROLES, memberRoleLabel, type MemberRole, type OrganisationMemberWithUser } from '../types'

interface Props {
  member: OrganisationMemberWithUser
  isCurrentUser: boolean
  canManage: boolean
  onChanged: () => void
}

const SELECT_CLASSES =
  'cursor-pointer rounded-md border border-border-subtle bg-surface-sunken px-2 py-1.5 text-[12px] font-semibold text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40'
const DATE_INPUT_CLASSES =
  'rounded-md border border-border-subtle bg-surface-sunken px-2 py-1.5 text-[12px] text-text-primary transition-colors duration-150 ease-out hover:border-border focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40'

export default function MemberRow({ member, isCurrentUser, canManage, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ownership can't be reassigned from this UI, and owners never expire
  // (enforced by a CHECK constraint too) — so the owner row is display-only.
  const editable = canManage && member.role !== 'owner'
  const isExpired = member.expires_at !== null && new Date(member.expires_at) <= new Date()
  const name = member.displayName ?? member.email

  async function withBusy(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function handleRoleChange(role: MemberRole) {
    void withBusy(() => updateOrganisationMember(member.id, { role }))
  }

  function handleExpiryChange(value: string) {
    void withBusy(() => updateOrganisationMember(member.id, { expiresAt: value ? new Date(value).toISOString() : null }))
  }

  function handleRemove() {
    if (!window.confirm(`Remove ${name} from your team?`)) return
    void withBusy(() => removeOrganisationMember(member.id))
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle px-4 py-3 first:border-t-0">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full ring-1 ring-overlay/10" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[13px] font-semibold text-text-secondary ring-1 ring-overlay/10" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-text-primary">{name}</span>
          {isCurrentUser && (
            <span className="shrink-0 rounded-md bg-overlay/5 px-1.5 py-0.5 text-[10px] font-semibold text-text-faint">You</span>
          )}
        </div>
        <div className="truncate text-[11.5px] text-text-tertiary">{member.email}</div>
      </div>

      {editable ? (
        <select
          className={SELECT_CLASSES}
          value={member.role}
          disabled={busy}
          onChange={e => handleRoleChange(e.target.value as MemberRole)}
        >
          {ASSIGNABLE_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      ) : (
        <span className="rounded-md border border-border-subtle bg-surface-sunken px-2 py-1 text-[11.5px] font-semibold text-text-secondary">
          {memberRoleLabel(member.role)}
        </span>
      )}

      {editable ? (
        <input
          type="date"
          className={DATE_INPUT_CLASSES}
          value={member.expires_at ? member.expires_at.slice(0, 10) : ''}
          disabled={busy}
          onChange={e => handleExpiryChange(e.target.value)}
        />
      ) : (
        <span className={`text-[11.5px] whitespace-nowrap ${isExpired ? 'font-semibold text-danger-text' : 'text-text-faint'}`}>
          {member.expires_at
            ? `${isExpired ? 'Expired ' : ''}${new Date(member.expires_at).toLocaleDateString()}`
            : 'No expiry'}
        </span>
      )}

      {editable && !isCurrentUser && (
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-[11.5px] font-semibold text-danger-text transition-colors duration-150 ease-out hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-40"
          disabled={busy}
          onClick={handleRemove}
        >
          Remove
        </button>
      )}

      {error && <p className="m-0 w-full text-[11.5px] text-danger-text">{error}</p>}
    </div>
  )
}
