import { supabase } from '../../../lib/supabase'
import type { Container, Variable, VariableInsert, VariableUpdate, VariableWithContainer } from '../types'

// display_id must match ^VARID_[A-Z]{2}_[0-9]{4}$ (see supabase/migrations).
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

export async function listVariables(): Promise<VariableWithContainer[]> {
  const { data, error } = await supabase
    .from('variables')
    .select('*, containers(name)')
    .is('deleted_at', null)
    .order('created_at')
    .overrideTypes<{ containers: { name: string } | null }[]>()
  if (error) throw error

  return (data ?? []).map(v => ({
    ...v,
    containerName: v.containers?.name ?? 'Unknown container',
  }))
}

export async function createVariable(input: Omit<VariableInsert, 'display_id'>): Promise<Variable> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('variables')
      .insert({ ...input, display_id: generateDisplayId('VARID') })
      .select()
      .single()

    if (!error) return data
    if (error.code !== '23505') throw error
  }
  throw new Error('Could not generate a unique variable ID. Please try again.')
}

export async function updateVariable(id: string, patch: VariableUpdate): Promise<Variable> {
  const { data, error } = await supabase
    .from('variables')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVariable(id: string): Promise<void> {
  const { error } = await supabase
    .from('variables')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
