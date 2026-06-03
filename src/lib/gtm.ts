export interface GtmAccount {
  accountId: string
  name: string
  path: string
}

export interface GtmContainer {
  containerId: string
  name: string
  publicId: string
  path: string
}

export interface GtmWorkspace {
  workspaceId: string
  name: string
  description?: string
  path: string
}

export interface GtmTag {
  tagId: string
  name: string
  type: string
  paused?: boolean
  notes?: string
  path: string
  fingerprint?: string
  tagFiringOption?: string
}

const BASE = 'https://tagmanager.googleapis.com/tagmanager/v2'

async function gtmGet<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = `GTM API error (${res.status})`
    try {
      const json = await res.json()
      message = json?.error?.message ?? message
    } catch {
      // response wasn't JSON — fall back to the status message
    }
    const err = new Error(message) as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function getAccounts(token: string): Promise<GtmAccount[]> {
  const data = await gtmGet<{ account?: GtmAccount[] }>(`${BASE}/accounts`, token)
  return data.account ?? []
}

export async function getContainers(accountId: string, token: string): Promise<GtmContainer[]> {
  const data = await gtmGet<{ container?: GtmContainer[] }>(
    `${BASE}/accounts/${accountId}/containers`,
    token
  )
  return data.container ?? []
}

export async function getWorkspaces(accountId: string, containerId: string, token: string): Promise<GtmWorkspace[]> {
  const data = await gtmGet<{ workspace?: GtmWorkspace[] }>(
    `${BASE}/accounts/${accountId}/containers/${containerId}/workspaces`,
    token
  )
  return data.workspace ?? []
}

export async function getTags(
  accountId: string,
  containerId: string,
  workspaceId: string,
  token: string
): Promise<GtmTag[]> {
  const data = await gtmGet<{ tag?: GtmTag[] }>(
    `${BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`,
    token
  )
  return data.tag ?? []
}

export const TAG_TYPE_LABELS: Record<string, string> = {
  awct: 'Google Ads Conversion',
  awrct: 'Google Ads Remarketing',
  adwords_website_call_conversion_phone_number: 'Ads Call Conversion',
  ua: 'Universal Analytics',
  ga4: 'GA4 Configuration',
  ga4Event: 'GA4 Event',
  gaawe: 'GA4 Enhanced Conversions',
  googtag: 'Google Tag',
  html: 'Custom HTML',
  img: 'Custom Image',
  fls: 'Floodlight Counter',
  flsa: 'Floodlight Activity',
  gclidw: 'Google Click ID',
  sp: 'Scroll Depth',
  msft_uet_tag: 'Microsoft Ads UET',
  fbq: 'Meta Pixel',
  linkedin_insight: 'LinkedIn Insight',
  tiktok_pixel: 'TikTok Pixel',
}

export const TAG_TYPE_CATEGORY: Record<string, string> = {
  awct: 'google-ads',
  awrct: 'google-ads',
  adwords_website_call_conversion_phone_number: 'google-ads',
  gclidw: 'google-ads',
  ua: 'analytics',
  ga4: 'analytics',
  ga4Event: 'analytics',
  gaawe: 'analytics',
  googtag: 'analytics',
  html: 'custom',
  img: 'custom',
  sp: 'custom',
  fls: 'floodlight',
  flsa: 'floodlight',
  fbq: 'social',
  linkedin_insight: 'social',
  tiktok_pixel: 'social',
  msft_uet_tag: 'advertising',
}

export function tagLabel(type: string): string {
  return TAG_TYPE_LABELS[type] ?? type
}

export function tagCategory(type: string): string {
  return TAG_TYPE_CATEGORY[type] ?? 'other'
}
