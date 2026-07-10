import { supabase } from '../../../lib/supabase'
import type {
  Container,
  ConversionEvent,
  ConversionEventInsert,
  ConversionEventUpdate,
  ConversionEventWithContainer,
} from '../types'

// display_id must match ^CONID_[A-Z]{2}_[0-9]{4}$ / ^CNTID_[A-Z]{2}_[0-9]{4}$ (see
// supabase/migrations). No server-side sequence exists for either, so a placeholder is
// generated and retried on the rare unique-constraint collision.
function generateDisplayId(prefix: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}_XX_${suffix}`
}

function mapConversionEventRow(
  row: ConversionEvent & { containers: { name: string; google_ads_conversion_id: string | null } | null }
): ConversionEventWithContainer {
  return {
    ...row,
    containerName: row.containers?.name ?? 'Unknown container',
    containerGoogleAdsConversionId: row.containers?.google_ads_conversion_id ?? null,
  }
}

// Conversions is the only feature still reading/writing Supabase containers directly —
// Tags/Triggers/Variables all read live from the GTM API instead. There's no UI anywhere
// that creates a containers row for a real (non-seeded) organisation, so this resolves
// the Supabase row backing whichever GTM container the user has picked, creating it on
// first use rather than requiring a separate "add container" step.
export async function getCurrentOrganisationId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('organisation_members')
    .select('organisation_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No organisation membership found for this account.')
  return data.organisation_id
}

export async function ensureContainerForGtmContainer(
  organisationId: string,
  gtmContainer: { name: string; publicId: string }
): Promise<Container> {
  const findExisting = async () => {
    const { data, error } = await supabase
      .from('containers')
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('gtm_container_id', gtmContainer.publicId)
      .is('deleted_at', null)
      .maybeSingle()
    if (error) throw error
    return data
  }

  const existing = await findExisting()
  if (existing) return existing

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('containers')
      .insert({
        organisation_id: organisationId,
        name: gtmContainer.name,
        gtm_container_id: gtmContainer.publicId,
        display_id: generateDisplayId('CNTID'),
      })
      .select()
      .single()
    if (!error) return data
    if (error.code !== '23505') throw error
    const raceWinner = await findExisting()
    if (raceWinner) return raceWinner
  }
  throw new Error('Could not create a container for this GTM container. Please try again.')
}

export async function listConversionEventsForContainer(containerId: string): Promise<ConversionEventWithContainer[]> {
  const { data, error } = await supabase
    .from('conversion_events')
    .select('*, containers(name, google_ads_conversion_id)')
    .eq('container_id', containerId)
    .is('deleted_at', null)
    .order('created_at')
    .overrideTypes<{ containers: { name: string; google_ads_conversion_id: string | null } | null }[]>()
  if (error) throw error
  return (data ?? []).map(mapConversionEventRow)
}

export async function createConversionEvent(
  input: Omit<ConversionEventInsert, 'display_id'>
): Promise<ConversionEvent> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('conversion_events')
      .insert({ ...input, display_id: generateDisplayId('CONID') })
      .select()
      .single()

    if (!error) return data
    if (error.code !== '23505') throw error
  }
  throw new Error('Could not generate a unique conversion event ID. Please try again.')
}

export async function updateConversionEvent(
  id: string,
  patch: ConversionEventUpdate
): Promise<ConversionEvent> {
  const { data, error } = await supabase
    .from('conversion_events')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteConversionEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversion_events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
