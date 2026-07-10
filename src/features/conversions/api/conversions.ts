import { supabase } from '../../../lib/supabase'
import type {
  Container,
  ConversionEvent,
  ConversionEventInsert,
  ConversionEventUpdate,
  ConversionEventWithContainer,
} from '../types'

// display_id must match ^CONID_[A-Z]{2}_[0-9]{4}$ (see supabase/migrations).
// No server-side sequence exists for this, so we generate a placeholder and
// retry on the rare unique-constraint collision (see api/triggers.ts).
function generateDisplayId(prefix: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}_XX_${suffix}`
}

export async function listContainers(): Promise<Container[]> {
  const { data, error } = await supabase
    .from('containers')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function listConversionEvents(): Promise<ConversionEventWithContainer[]> {
  const { data, error } = await supabase
    .from('conversion_events')
    .select('*, containers(name, google_ads_conversion_id)')
    .is('deleted_at', null)
    .order('created_at')
    .overrideTypes<{ containers: { name: string; google_ads_conversion_id: string | null } | null }[]>()
  if (error) throw error

  return (data ?? []).map(c => ({
    ...c,
    containerName: c.containers?.name ?? 'Unknown container',
    containerGoogleAdsConversionId: c.containers?.google_ads_conversion_id ?? null,
  }))
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
