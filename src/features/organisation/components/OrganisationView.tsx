import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getMyMembership, type MyMembership } from '../../../lib/organisation'
import { getOrganisation } from '../../settings/api/settings'
import { getInviteCode, regenerateInviteCode } from '../api/organisation'
import { memberRoleLabel, type OrganisationSummary } from '../../settings/types'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import LoadingState from '../../../components/LoadingState'

interface Props {
  session: Session
}

const SECONDARY_BUTTON =
  'rounded-md border border-border bg-transparent px-3.5 py-2 text-[12.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50'

export default function OrganisationView({ session }: Props) {
  const [membership, setMembership] = useState<MyMembership | null>(null)
  const [organisation, setOrganisation] = useState<OrganisationSummary | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [codeLoading, setCodeLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const my = await getMyMembership(session.user.id)
      setMembership(my)
      setOrganisation(await getOrganisation(my.organisationId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your organisation.')
    } finally {
      setLoading(false)
    }
  }, [session.user.id])

  useEffect(() => { load() }, [load])

  const canManage = membership?.role === 'owner' || membership?.role === 'admin'

  useEffect(() => {
    if (!membership || !canManage) return
    setCodeLoading(true)
    getInviteCode(membership.organisationId)
      .then(setInviteCode)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load the invite code.'))
      .finally(() => setCodeLoading(false))
  }, [membership, canManage])

  async function handleRegenerate() {
    if (!membership) return
    setRegenerating(true)
    setError(null)
    try {
      setInviteCode(await regenerateInviteCode(membership.organisationId))
      setCopied(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to regenerate the invite code.')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleCopy() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-[680px] px-10 pt-10 pb-15">
      <ViewHeader title="Organisation" subtitle="Invite teammates to join your account" />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingState label="Loading your organisation…" />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-3">
              <h2 className="m-0 text-[13.5px] font-semibold text-text-primary">{organisation?.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-[12.5px] text-text-tertiary">
              <span>ID: <span className="font-mono text-text-secondary">{organisation?.display_id}</span></span>
              <span>Your role: <span className="font-semibold text-text-secondary">{membership ? memberRoleLabel(membership.role) : ''}</span></span>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-3">
              <h2 className="m-0 text-[13.5px] font-semibold text-text-primary">Invite teammates</h2>
            </div>
            {canManage ? (
              <div className="flex flex-col gap-3 px-4 py-4">
                <p className="m-0 text-[12.5px] leading-relaxed text-text-tertiary">
                  Share this code — anyone who enters it while signing in to TagOps Pro joins your organisation as an Editor.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-[15px] tracking-wider text-text-primary">
                    {codeLoading || !inviteCode ? '········' : inviteCode}
                  </code>
                  <button type="button" className={SECONDARY_BUTTON} onClick={handleCopy} disabled={!inviteCode || codeLoading}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  className="self-start rounded-md px-1 py-1 text-[12px] font-semibold text-text-tertiary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleRegenerate}
                  disabled={regenerating || codeLoading}
                >
                  {regenerating ? 'Regenerating…' : 'Regenerate code'}
                </button>
                <p className="m-0 text-[11.5px] text-text-faint">Regenerating immediately invalidates the old code.</p>
              </div>
            ) : (
              <p className="m-0 px-4 py-4 text-[12.5px] text-text-tertiary">Ask an owner or admin for the invite code.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
