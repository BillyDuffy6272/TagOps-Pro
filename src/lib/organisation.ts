import { supabase } from './supabase'

export interface MyMembership {
  organisationId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
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
  if (error) throw error
  if (!data) return null
  return { organisationId: data.organisation_id, role: data.role }
}

// Every feature that touches Supabase-backed org data (Conversions, Settings)
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
