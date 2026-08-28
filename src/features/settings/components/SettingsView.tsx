import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ActiveView } from '../../../components/AppShell'
import { getMyMembership, listPendingAccessRequests, resolveAccessRequest, type AccessRequestWithUser, type MyMembership } from '../../../lib/organisation'
import { useTheme, type Theme } from '../../../lib/ThemeContext'
import { getOrganisation, listOrganisationMembers, updateOrganisationName } from '../api/settings'
import type { OrganisationMemberWithUser, OrganisationSummary } from '../types'
import MemberRow from './MemberRow'
import AddMemberModal from './AddMemberModal'
import ViewHeader from '../../../components/ViewHeader'
import ErrorBanner from '../../../components/ErrorBanner'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'

interface Props {
  session: Session
  setActiveView: (view: ActiveView) => void
}

const SECTION_TITLE = 'm-0 text-[13.5px] font-semibold text-text-primary'

const THEME_OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
]

export default function SettingsView({ session, setActiveView }: Props) {
  const user = session.user
  const fullName = user.user_metadata?.full_name as string | undefined
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const { theme, setTheme } = useTheme()

  const [membership, setMembership] = useState<MyMembership | null>(null)
  const [organisation, setOrganisation] = useState<OrganisationSummary | null>(null)
  const [members, setMembers] = useState<OrganisationMemberWithUser[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequestWithUser[]>([])
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null)

  const [orgNameDraft, setOrgNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const my = await getMyMembership(user.id)
      setMembership(my)
      const canManage = my.role === 'owner' || my.role === 'admin'
      const [org, memberList, pending] = await Promise.all([
        getOrganisation(my.organisationId),
        listOrganisationMembers(my.organisationId),
        canManage ? listPendingAccessRequests(my.organisationId) : Promise.resolve([]),
      ])
      setOrganisation(org)
      setOrgNameDraft(org.name)
      setMembers(memberList)
      setAccessRequests(pending)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your settings.')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])

  const canManageTeam = membership?.role === 'owner' || membership?.role === 'admin'
  const isOwner = membership?.role === 'owner'

  async function handleResolveRequest(request: AccessRequestWithUser, decision: 'approved' | 'dismissed') {
    setResolvingRequestId(request.id)
    setError(null)
    try {
      const member = members.find(m => m.user_id === request.user_id)
      await resolveAccessRequest(request.id, member?.id ?? null, decision, user.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update that request.')
    } finally {
      setResolvingRequestId(null)
    }
  }

  async function handleSaveName(e: FormEvent) {
    e.preventDefault()
    if (!organisation) return
    const trimmed = orgNameDraft.trim()
    if (!trimmed || trimmed === organisation.name) return
    setSavingName(true)
    setNameError(null)
    try {
      const updated = await updateOrganisationName(organisation.id, trimmed)
      setOrganisation(updated)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update the organisation name.')
    } finally {
      setSavingName(false)
    }
  }

  return (
    <div className="mx-auto max-w-[820px] px-10 pt-10 pb-15">
      <ViewHeader title="Settings" subtitle="Your profile, organisation, and team" />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingState label="Loading your settings…" />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-3">
              <h2 className={SECTION_TITLE}>Profile</h2>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full ring-1 ring-overlay/10" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[17px] font-semibold text-text-secondary ring-1 ring-overlay/10" aria-hidden="true">
                  {(fullName ?? user.email ?? 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-text-primary">{fullName ?? 'Unnamed'}</div>
                <div className="truncate text-[12.5px] text-text-tertiary">{user.email}</div>
              </div>
            </div>
            <p className="m-0 border-t border-border-subtle px-4 py-2.5 text-[11.5px] text-text-faint">
              Your name and photo come from your Google account and can't be edited here.
            </p>
          </section>

          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="border-b border-border-subtle px-4 py-3">
              <h2 className={SECTION_TITLE}>Appearance</h2>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div>
                <div className="text-[13px] font-medium text-text-secondary">Theme</div>
                <p className="m-0 text-[11.5px] text-text-faint">Choose how TagOps Pro looks on this device.</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={theme === opt.value}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      theme === opt.value ? 'bg-accent-muted text-accent' : 'text-text-tertiary hover:bg-overlay/5 hover:text-text-secondary'
                    }`}
                    onClick={() => setTheme(opt.value)}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
              <h2 className={SECTION_TITLE}>Organisation</h2>
              <button
                type="button"
                className="rounded-md border border-border bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => setActiveView('organisation')}
              >
                Invite teammates
              </button>
            </div>
            <form onSubmit={handleSaveName} className="flex flex-col gap-2 px-4 py-4">
              {nameError && <p className="m-0 text-[12px] text-danger-text">{nameError}</p>}
              <label className="text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase" htmlFor="org-name">
                Organisation name
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="org-name"
                  name="org-name"
                  autoComplete="off"
                  className="w-full max-w-[320px] rounded-md border border-border bg-surface px-2.5 py-2 text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                  value={orgNameDraft}
                  disabled={!isOwner || savingName}
                  onChange={e => setOrgNameDraft(e.target.value)}
                />
                {isOwner && (
                  <button
                    type="submit"
                    className="shrink-0 rounded-md border border-border bg-transparent px-3 py-2 text-[12.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={savingName || !organisation || orgNameDraft.trim() === organisation.name}
                  >
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
              {!isOwner && (
                <p className="m-0 text-[11.5px] text-text-faint">Only the organisation owner can rename it.</p>
              )}
            </form>
          </section>

          {canManageTeam && (
            <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
              <div className="border-b border-border-subtle px-4 py-3">
                <h2 className={SECTION_TITLE}>Access requests {accessRequests.length > 0 && `(${accessRequests.length})`}</h2>
              </div>

              {accessRequests.length === 0 ? (
                <EmptyState message="No pending requests." />
              ) : (
                accessRequests.map(request => (
                  <div key={request.id} className="flex flex-wrap items-center gap-3 border-t border-border-subtle px-4 py-3 first:border-t-0">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-text-primary">
                        {request.displayName ?? request.email}
                      </div>
                      <div className="truncate text-[11.5px] text-text-tertiary">
                        Wants editor access{request.message ? ` — “${request.message}”` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={resolvingRequestId === request.id}
                      onClick={() => handleResolveRequest(request, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded-md border border-border bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={resolvingRequestId === request.id}
                      onClick={() => handleResolveRequest(request, 'dismissed')}
                    >
                      Dismiss
                    </button>
                  </div>
                ))
              )}
            </section>
          )}

          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken">
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
              <h2 className={SECTION_TITLE}>Team ({members.length})</h2>
              {canManageTeam && (
                <button
                  type="button"
                  className="rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay"
                  onClick={() => setAddOpen(true)}
                >
                  Add member
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <EmptyState message="No team members yet." />
            ) : (
              members.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isCurrentUser={member.user_id === user.id}
                  canManage={Boolean(canManageTeam)}
                  onChanged={load}
                />
              ))
            )}

            {!canManageTeam && (
              <p className="m-0 border-t border-border-subtle px-4 py-2.5 text-[11.5px] text-text-faint">
                Only owners and admins can add, edit, or remove team members.
              </p>
            )}
          </section>
        </div>
      )}

      {addOpen && membership && (
        <AddMemberModal
          organisationId={membership.organisationId}
          currentUserId={user.id}
          onClose={() => setAddOpen(false)}
          onAdded={load}
        />
      )}
    </div>
  )
}
