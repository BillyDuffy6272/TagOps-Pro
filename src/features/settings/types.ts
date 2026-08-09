import type { Tables, TablesUpdate } from '../../types/supabase'

export type Organisation = Tables<'organisations'>
export type OrganisationUpdate = TablesUpdate<'organisations'>
export type OrganisationMember = Tables<'organisation_members'>
export type MemberRole = OrganisationMember['role']

export interface OrganisationMemberWithUser extends OrganisationMember {
  displayName: string | null
  email: string
  avatarUrl: string | null
}

export interface UserLookupResult {
  id: string
  displayName: string | null
  avatarUrl: string | null
  email: string
}

// Ownership transfer is a separate, more sensitive operation than day-to-day
// team management, so "owner" is deliberately not an assignable role here.
export const ASSIGNABLE_ROLES: { value: MemberRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Can manage tags, triggers, variables, and the team' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit tracking setup' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

export function memberRoleLabel(role: MemberRole): string {
  if (role === 'owner') return 'Owner'
  return ASSIGNABLE_ROLES.find(r => r.value === role)?.label ?? role
}
