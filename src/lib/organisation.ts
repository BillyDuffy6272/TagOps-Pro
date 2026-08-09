import { supabase } from './supabase'

export interface MyMembership {
  organisationId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

// Every feature that touches Supabase-backed org data (Conversions, Settings)
// needs to resolve "which organisation am I in, and what can I do there" —
// a single active-membership row per user in the current MVP (no
// multi-org switching yet).
export async function getMyMembership(userId: string): Promise<MyMembership> {
  const { data, error } = await supabase
    .from('organisation_members')
    .select('organisation_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No organisation membership found for this account.')
  return { organisationId: data.organisation_id, role: data.role }
}

// display_id must match ^PREFIX_[A-Z]{2}_[0-9]{4}$ (see supabase/migrations).
// No server-side sequence exists for app-inserted rows, so a placeholder is
// generated client-side and retried on the rare unique-constraint collision.
export function generateDisplayId(prefix: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}_XX_${suffix}`
}
