import { supabase, toError } from '../../../lib/supabase'
import { generateDisplayId } from '../../../lib/organisation'
import type { OrganisationSummary } from '../../settings/types'

const ORGANISATION_SUMMARY_COLUMNS = 'id, display_id, name, slug, owner_id, created_at, updated_at, deleted_at'

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return base || 'org'
}

async function fetchOrganisationBySlug(slug: string): Promise<OrganisationSummary> {
  const { data, error } = await supabase
    .from('organisations')
    .select(ORGANISATION_SUMMARY_COLUMNS)
    .eq('slug', slug)
    .single()
  if (error) throw toError(error)
  return data
}

// The owner membership row is created for free by the auto_owner_membership()
// trigger the moment this insert succeeds — but that's *after* the insert
// completes, and chaining .select() onto the insert asks PostgREST for
// INSERT ... RETURNING, which Postgres re-checks against the table's own
// SELECT policy ("members can select organisations") before the trigger's
// effect is visible to that check. For a brand-new organisation the creator
// isn't a member of anything yet, so that check fails and the whole insert
// gets rejected — even though the row itself is perfectly valid. Splitting
// into a plain insert (no RETURNING) followed by a separate SELECT avoids
// the race: by the time the second request runs, the first has committed
// and the trigger's membership row is visible.
export async function createOrganisation(name: string, ownerId: string): Promise<OrganisationSummary> {
  const base = slugify(name)
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.floor(1000 + Math.random() * 9000)}`
    const { error } = await supabase
      .from('organisations')
      .insert({ name, slug, owner_id: ownerId, display_id: generateDisplayId('ORGID') })
    if (!error) return fetchOrganisationBySlug(slug)
    if (error.code !== '23505') throw toError(error)
  }
  throw new Error('Could not create your organisation. Please try again.')
}

// Owner/admin only — enforced inside the function itself, not by RLS (the
// invite_code column has no client-visible RLS surface at all; see
// supabase/migrations/20260818000000).
export async function getInviteCode(organisationId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_invite_code', { org_id: organisationId })
  if (error) throw toError(error)
  return data
}

export async function regenerateInviteCode(organisationId: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', { org_id: organisationId })
  if (error) throw toError(error)
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
  if (error) throw toError(error)
  const row = data?.[0]
  if (!row) return null
  return { organisationId: row.organisation_id, organisationName: row.organisation_name, alreadyMember: row.already_member }
}
