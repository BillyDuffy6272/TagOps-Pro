import { supabase, toError } from './supabase'
import type { Tables } from '../types/supabase'

export interface MyMembership {
  organisationId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

export type AccessRequestStatus = 'pending' | 'approved' | 'dismissed'
export type AccessRequest = Tables<'access_requests'>
export interface AccessRequestWithUser extends AccessRequest {
  displayName: string | null
  email: string
}

// A missing membership isn't an error — it's the real, expected state for a
// brand-new sign-in before they've created or joined an organisation. This
// is the non-throwing form Dashboard uses to decide whether to gate into
// onboarding; getMyMembership below is the throwing form everything else
// uses once an organisation is known to exist.
export async function checkMyMembership(userId: string): Promise<MyMembership | null> {
  const { data, error } = await supabase
    .from('organisation_members')
    .select('organisation_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw toError(error)
  if (!data) return null
  return { organisationId: data.organisation_id, role: data.role }
}

// Every feature that touches Supabase-backed org data (Settings, Organisation)
// needs to resolve "which organisation am I in, and what can I do there" —
// a single active-membership row per user in the current MVP (no
// multi-org switching yet).
export async function getMyMembership(userId: string): Promise<MyMembership> {
  const membership = await checkMyMembership(userId)
  if (!membership) throw new Error('No organisation membership found for this account.')
  return membership
}

// display_id must match ^PREFIX_[A-Z]{2}_[0-9]{4}$ (see supabase/migrations).
// No server-side sequence exists for app-inserted rows, so a placeholder is
// generated client-side and retried on the rare unique-constraint collision.
export function generateDisplayId(prefix: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}_XX_${suffix}`
}

// A viewer's only path to becoming an editor: request it, rather than
// silently hitting an RLS rejection the first time they try to write
// something. The "one pending request per user per org" unique index on
// access_requests means a second attempt while one is still pending fails
// with a 23505 here, which the UI treats as "you already have one open."
export async function requestAccess(
  organisationId: string,
  userId: string,
  message: string | null
): Promise<AccessRequest> {
  const { data, error } = await supabase
    .from('access_requests')
    .insert({
      organisation_id: organisationId,
      user_id: userId,
      message,
      display_id: generateDisplayId('REQID'),
    })
    .select()
    .single()
  if (error) throw toError(error)
  return data
}

// The requester's own view of their latest request — lets the UI show
// "request sent" / "request denied, ask again" instead of re-showing the
// button as if nothing happened.
export async function getMyLatestAccessRequest(
  organisationId: string,
  userId: string
): Promise<AccessRequest | null> {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw toError(error)
  return data
}

// Owner/admin-only per RLS — listing anyone else's requests fails silently
// (returns nothing) rather than erroring, by design of the select policy.
export async function listPendingAccessRequests(organisationId: string): Promise<AccessRequestWithUser[]> {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*, users!user_id(display_name, email)')
    .eq('organisation_id', organisationId)
    .eq('status', 'pending')
    .order('created_at')
    .overrideTypes<(AccessRequest & { users: { display_name: string | null; email: string } | null })[]>()
  if (error) throw toError(error)
  return (data ?? []).map(row => ({
    ...row,
    displayName: row.users?.display_name ?? null,
    email: row.users?.email ?? 'Unknown',
  }))
}

// Approving grants the access, not just marks a status — the two writes
// aren't atomic (no RPC wraps them), but the member-role update is the one
// that actually matters; if it fails the request stays pending and can be
// retried, rather than silently "approved" with no effect.
export async function resolveAccessRequest(
  requestId: string,
  memberId: string | null,
  decision: 'approved' | 'dismissed',
  resolvedBy: string
): Promise<void> {
  if (decision === 'approved' && memberId) {
    const { error: roleError } = await supabase
      .from('organisation_members')
      .update({ role: 'editor' })
      .eq('id', memberId)
    if (roleError) throw toError(roleError)
  }
  const { error } = await supabase
    .from('access_requests')
    .update({ status: decision, resolved_at: new Date().toISOString(), resolved_by: resolvedBy })
    .eq('id', requestId)
  if (error) throw toError(error)
}
