import { supabase } from '../../../lib/supabase'
import { generateDisplayId } from '../../../lib/organisation'
import type {
  MemberRole,
  OrganisationMember,
  OrganisationMemberWithUser,
  OrganisationSummary,
  UserLookupResult,
} from '../types'

// invite_code has column-level SELECT revoked (see migrations), so every
// select here must name columns explicitly — a bare '*' would fail outright.
const ORGANISATION_SUMMARY_COLUMNS = 'id, display_id, name, slug, owner_id, created_at, updated_at, deleted_at'

export async function getOrganisation(organisationId: string): Promise<OrganisationSummary> {
  const { data, error } = await supabase
    .from('organisations')
    .select(ORGANISATION_SUMMARY_COLUMNS)
    .eq('id', organisationId)
    .single()
  if (error) throw error
  return data
}

export async function updateOrganisationName(organisationId: string, name: string): Promise<OrganisationSummary> {
  const { data, error } = await supabase
    .from('organisations')
    .update({ name })
    .eq('id', organisationId)
    .select(ORGANISATION_SUMMARY_COLUMNS)
    .single()
  if (error) throw error
  return data
}

function mapMemberRow(
  row: OrganisationMember & { users: { display_name: string | null; avatar_url: string | null; email: string } | null }
): OrganisationMemberWithUser {
  return {
    ...row,
    displayName: row.users?.display_name ?? null,
    email: row.users?.email ?? 'Unknown',
    avatarUrl: row.users?.avatar_url ?? null,
  }
}

export async function listOrganisationMembers(organisationId: string): Promise<OrganisationMemberWithUser[]> {
  const { data, error } = await supabase
    .from('organisation_members')
    .select('*, users(display_name, avatar_url, email)')
    .eq('organisation_id', organisationId)
    .order('joined_at')
    .overrideTypes<{ users: { display_name: string | null; avatar_url: string | null; email: string } | null }[]>()
  if (error) throw error
  return (data ?? []).map(mapMemberRow)
}

// Looks up a person by email for "add a member" — only returns a hit for an
// exact match via the find_user_by_email RPC (see supabase/migrations), which
// deliberately doesn't expose a broader user directory.
export async function findUserByEmail(email: string): Promise<UserLookupResult | null> {
  const { data, error } = await supabase.rpc('find_user_by_email', { lookup_email: email })
  if (error) throw error
  const row = data?.[0]
  if (!row) return null
  return { id: row.id, displayName: row.display_name, avatarUrl: row.avatar_url, email: row.email }
}

export async function addOrganisationMember(input: {
  organisationId: string
  userId: string
  role: MemberRole
  expiresAt: string | null
  invitedBy: string
}): Promise<OrganisationMember> {
  const { data: existing, error: existingError } = await supabase
    .from('organisation_members')
    .select('id')
    .eq('organisation_id', input.organisationId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) throw new Error('This person is already on your team.')

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('organisation_members')
      .insert({
        organisation_id: input.organisationId,
        user_id: input.userId,
        role: input.role,
        expires_at: input.expiresAt,
        invited_by: input.invitedBy,
        display_id: generateDisplayId('MEMID'),
      })
      .select()
      .single()
    if (!error) return data
    if (error.code !== '23505') throw error
  }
  throw new Error('Could not generate a unique member ID. Please try again.')
}

export async function updateOrganisationMember(
  memberId: string,
  patch: { role?: MemberRole; expiresAt?: string | null }
): Promise<OrganisationMember> {
  const { data, error } = await supabase
    .from('organisation_members')
    .update({ role: patch.role, expires_at: patch.expiresAt })
    .eq('id', memberId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeOrganisationMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('organisation_members').delete().eq('id', memberId)
  if (error) throw error
}
