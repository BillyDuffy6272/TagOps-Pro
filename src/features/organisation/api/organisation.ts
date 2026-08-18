import { supabase } from '../../../lib/supabase'
import { generateDisplayId } from '../../../lib/organisation'
import type { OrganisationSummary } from '../../settings/types'

const ORGANISATION_SUMMARY_COLUMNS = 'id, display_id, name, slug, owner_id, created_at, updated_at, deleted_at'

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return base || 'org'
}

// The owner membership row is created for free by the auto_owner_membership()
// trigger the moment this insert succeeds — nothing else to do afterwards.
export async function createOrganisation(name: string, ownerId: string): Promise<OrganisationSummary> {
  const base = slugify(name)
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.floor(1000 + Math.random() * 9000)}`
    const { data, error } = await supabase
      .from('organisations')
      .insert({ name, slug, owner_id: ownerId, display_id: generateDisplayId('ORGID') })
      .select(ORGANISATION_SUMMARY_COLUMNS)
      .single()
    if (!error) return data
    if (error.code !== '23505') throw error
  }
  throw new Error('Could not create your organisation. Please try again.')
}

// Owner/admin only — enforced inside the function itself, not by RLS (the
// invite_code column has no client-visible RLS surface at all; see
// supabase/migrations/20260818000000).
export async function getInviteCode(organisationId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_invite_code', { org_id: organisationId })
  if (error) throw error
  return data
}

export async function regenerateInviteCode(organisationId: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', { org_id: organisationId })
  if (error) throw error
  return data
}

export interface RedeemResult {
  organisationId: string
  organisationName: string
  alreadyMember: boolean
}

// Returns null for an invalid/unknown code rather than throwing — that's an
// expected user-input outcome (typo'd code), not an application error.
export async function redeemInviteCode(code: string): Promise<RedeemResult | null> {
  const { data, error } = await supabase.rpc('redeem_invite_code', { code })
  if (error) throw error
  const row = data?.[0]
  if (!row) return null
  return { organisationId: row.organisation_id, organisationName: row.organisation_name, alreadyMember: row.already_member }
}
