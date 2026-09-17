import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { createOrganisation, redeemInviteCode } from '../api/organisation'

interface Props {
  session: Session
  // Called after a successful create or join — Dashboard re-checks
  // membership and swaps this screen out for the real app.
  onJoined: () => void
}

type Tab = 'create' | 'join'

const FIELD_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'
const FIELD_INPUT =
  'rounded-md border border-border bg-surface-sunken px-3 py-2.5 text-[13.5px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent'
const PRIMARY_BUTTON =
  'mt-1 rounded-md bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50'

// Full-screen gate rendered by Dashboard when a signed-in user has no
// organisation membership yet — every organisation-scoped page (Conversions,
// Settings) would otherwise just error, so this is where that dead end used
// to be.
export default function OrganisationOnboarding({ session, onJoined }: Props) {
  const [tab, setTab] = useState<Tab>('create')
  const [orgName, setOrgName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function switchTab(next: Tab) {
    setTab(next)
    setError(null)
    setNotice(null)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const trimmed = orgName.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      await createOrganisation(trimmed, session.user.id)
      onJoined()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create your organisation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    const trimmed = inviteCode.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const result = await redeemInviteCode(trimmed)
      if (!result) {
        setError("That invite code doesn't match any organisation. Double-check it with whoever sent it.")
        return
      }
      if (result.alreadyMember) setNotice(`You're already a member of ${result.organisationName}.`)
      onJoined()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join with that code.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(150deg,#080c14_0%,#0d1a2e_60%,#0a1628_100%)] px-6">
      <div className="w-full max-w-[440px] rounded-xl border border-border bg-surface px-10 py-11 shadow-[0_0_0_1px_var(--color-border),0_24px_48px_rgba(0,0,0,0.5)]">
        <h1 className="m-0 mb-1.5 text-center text-[21px] font-semibold text-text-primary">Welcome to TagOps Pro</h1>
        <p className="m-0 mb-7 text-center text-[13.5px] leading-relaxed text-text-tertiary">
          Create your own organisation, or join one with an invite code from a teammate.
        </p>

        <div className="mb-5 flex gap-1.5 rounded-lg bg-surface-sunken p-1">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ease-out ${
                tab === t ? 'bg-accent-muted text-accent' : 'text-text-tertiary hover:text-text-secondary'
              }`}
              onClick={() => switchTab(t)}
            >
              {t === 'create' ? 'Create new' : 'Join with code'}
            </button>
          ))}
        </div>

        {error && (
          <p className="m-0 mb-4 rounded-lg border border-danger/18 bg-danger/8 px-3.5 py-2.5 text-[13px] text-danger-text">{error}</p>
        )}
        {notice && (
          <p className="m-0 mb-4 rounded-lg border border-success/18 bg-success/8 px-3.5 py-2.5 text-[13px] text-success">{notice}</p>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL} htmlFor="org-name">Organisation name</label>
              <input
                id="org-name"
                className={FIELD_INPUT}
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Acme Co."
                required
                autoFocus
              />
            </div>
            <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
              {saving ? 'Creating…' : 'Create organisation'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL} htmlFor="invite-code">Invite code</label>
              <input
                id="invite-code"
                className={`${FIELD_INPUT} font-mono tracking-wider uppercase`}
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4"
                maxLength={8}
                required
                autoFocus
              />
              <p className="m-0 text-[12px] leading-relaxed text-text-faint">
                Ask an owner or admin of the team for their invite code (Settings → Organisation).
              </p>
            </div>
            <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
              {saving ? 'Joining…' : 'Join organisation'}
            </button>
          </form>
        )}

        <button
          type="button"
          className="mt-6 w-full text-center text-[12px] font-medium text-text-faint transition-colors duration-150 ease-out hover:text-text-tertiary"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
