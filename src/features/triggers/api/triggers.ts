import { supabase } from '../../../lib/supabase'
import type { Container, LinkedTag, Trigger, TriggerInsert, TriggerUpdate, TriggerWithTags } from '../types'

// display_id must match ^TRGID_[A-Z]{2}_[0-9]{4}$ (see supabase/migrations).
// There's no server-side sequence for trigger display_ids (unlike users/
// members), so the app generates a placeholder here and retries on the
// rare unique-constraint collision, matching the 'XX' placeholder
// convention already used elsewhere in the schema/seed comments.
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

async function listTagLinksForTriggers(triggerIds: string[]): Promise<Map<string, LinkedTag[]>> {
  const map = new Map<string, LinkedTag[]>()
  if (triggerIds.length === 0) return map

  const { data, error } = await supabase
    .from('tag_triggers')
    .select('trigger_id, relationship, tags(name)')
    .in('trigger_id', triggerIds)
    .overrideTypes<{ trigger_id: string; relationship: 'fires_on' | 'blocks'; tags: { name: string } | null }[]>()
  if (error) throw error

  for (const row of data ?? []) {
    if (!row.tags) continue
    const existing = map.get(row.trigger_id) ?? []
    existing.push({ name: row.tags.name, relationship: row.relationship })
    map.set(row.trigger_id, existing)
  }
  return map
}

export async function listTriggers(): Promise<TriggerWithTags[]> {
  const { data, error } = await supabase
    .from('triggers')
    .select('*, containers(name)')
    .is('deleted_at', null)
    .order('created_at')
    .overrideTypes<{ containers: { name: string } | null }[]>()
  if (error) throw error

  const triggers = data ?? []
  const tagLinks = await listTagLinksForTriggers(triggers.map(t => t.id))

  return triggers.map(t => ({
    ...t,
    containerName: t.containers?.name ?? 'Unknown container',
    tags: tagLinks.get(t.id) ?? [],
  }))
}

export async function createTrigger(input: Omit<TriggerInsert, 'display_id'>): Promise<Trigger> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('triggers')
      .insert({ ...input, display_id: generateDisplayId('TRGID') })
      .select()
      .single()

    if (!error) return data
    if (error.code !== '23505') throw error // not a unique-violation on display_id, don't retry
  }
  throw new Error('Could not generate a unique trigger ID. Please try again.')
}

export async function updateTrigger(id: string, patch: TriggerUpdate): Promise<Trigger> {
  const { data, error } = await supabase
    .from('triggers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTrigger(id: string): Promise<void> {
  const { error } = await supabase
    .from('triggers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
