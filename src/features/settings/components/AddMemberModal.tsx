import { useState, type FormEvent } from 'react'
import { addOrganisationMember, findUserByEmail } from '../api/settings'
import { ASSIGNABLE_ROLES, type MemberRole } from '../types'
import Modal from '../../../components/Modal'

interface Props {
  organisationId: string
  currentUserId: string
  onClose: () => void
  onAdded: () => void
}

const FIELD_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'
const FIELD_INPUT =
  'rounded-md border border-border bg-surface px-2.5 py-2 font-sans text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent'

export default function AddMemberModal({ organisationId, currentUserId, onClose, onAdded }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('editor')
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    setError(null)
    setSaving(true)
    try {
      const user = await findUserByEmail(trimmedEmail)
      if (!user) {
        setError("This person hasn't signed in to TagOps Pro yet. Ask them to sign in with Google once, then try adding them again.")
        return
      }
      await addOrganisationMember({
        organisationId,
        userId: user.id,
        role,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        invitedBy: currentUserId,
      })
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add this person to your team.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        title="Add a team member"
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-border bg-transparent px-4 py-1.5 text-[13px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </>
        }
      >
        {error && (
          <div className="rounded-md border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger-text">{error}</div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="member-email">Email</label>
          <input
            id="member-email"
            type="email"
            className={FIELD_INPUT}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            required
          />
          <p className="m-0 text-[12px] leading-relaxed text-text-faint">
            They need to have signed in to TagOps Pro with Google at least once before you can add them.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="member-role">Role</label>
          <select
            id="member-role"
            className={FIELD_INPUT}
            value={role}
            onChange={e => setRole(e.target.value as MemberRole)}
          >
            {ASSIGNABLE_ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="m-0 text-[12px] leading-relaxed text-text-faint">
            {ASSIGNABLE_ROLES.find(r => r.value === role)?.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="member-expiry">Access expires (optional)</label>
          <input
            id="member-expiry"
            type="date"
            className={FIELD_INPUT}
            value={expiresAt}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setExpiresAt(e.target.value)}
          />
          <p className="m-0 text-[12px] leading-relaxed text-text-faint">Leave empty for access that doesn't expire.</p>
        </div>
      </Modal>
    </form>
  )
}
