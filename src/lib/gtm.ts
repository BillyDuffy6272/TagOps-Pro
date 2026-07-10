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

export interface GtmParameter {
  type: string
  key?: string
  value?: string
  list?: GtmParameter[]
  map?: GtmParameter[]
}

export interface GtmCondition {
  type: string
  parameter?: GtmParameter[]
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
  parameter?: GtmParameter[]
  firingTriggerId?: string[]
  blockingTriggerId?: string[]
}

export interface GtmTrigger {
  triggerId: string
  name: string
  type: string
  notes?: string
  path: string
  fingerprint?: string
  eventName?: GtmParameter
  interval?: GtmParameter
  limit?: GtmParameter
  customEventFilter?: GtmCondition[]
}

export interface GtmVariable {
  variableId: string
  name: string
  type: string
  notes?: string
  parameter?: GtmParameter[]
  path: string
  fingerprint?: string
}

export interface TagUsage {
  tagId: string
  name: string
  relationship: 'fires_on' | 'blocks'
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

export async function getTriggers(
  accountId: string,
  containerId: string,
  workspaceId: string,
  token: string
): Promise<GtmTrigger[]> {
  const data = await gtmGet<{ trigger?: GtmTrigger[] }>(
    `${BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`,
    token
  )
  return data.trigger ?? []
}

export async function getVariables(
  accountId: string,
  containerId: string,
  workspaceId: string,
  token: string
): Promise<GtmVariable[]> {
  const data = await gtmGet<{ variable?: GtmVariable[] }>(
    `${BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/variables`,
    token
  )
  return data.variable ?? []
}

// GTM stores a custom-event trigger's match as a filter condition (arg0 = "{{_event}}",
// arg1 = the literal event name) rather than a plain top-level field, so this falls back
// to reading that condition when eventName isn't set directly.
export function triggerEventName(trigger: GtmTrigger): string | undefined {
  if (trigger.eventName?.value) return trigger.eventName.value
  const arg1 = trigger.customEventFilter?.[0]?.parameter?.find(p => p.key === 'arg1')
  return arg1?.value
}

// Variable references inside tag parameters use GTM's "{{Variable Name}}" template syntax,
// nested arbitrarily deep inside list/map parameter types.
export function extractVariableNames(parameters?: GtmParameter[]): string[] {
  const names = new Set<string>()
  const scan = (value?: string) => {
    if (!value) return
    for (const m of value.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) names.add(m[1])
  }
  const walk = (params?: GtmParameter[]) => {
    if (!params) return
    for (const p of params) {
      scan(p.value)
      walk(p.list)
      walk(p.map)
    }
  }
  walk(parameters)
  return [...names]
}

export function tagsUsingTrigger(triggerId: string, tags: GtmTag[]): TagUsage[] {
  const usage: TagUsage[] = []
  for (const tag of tags) {
    if (tag.firingTriggerId?.includes(triggerId)) {
      usage.push({ tagId: tag.tagId, name: tag.name, relationship: 'fires_on' })
    }
    if (tag.blockingTriggerId?.includes(triggerId)) {
      usage.push({ tagId: tag.tagId, name: tag.name, relationship: 'blocks' })
    }
  }
  return usage
}

export function tagsUsingVariable(variableName: string, tags: GtmTag[]): { tagId: string; name: string }[] {
  return tags
    .filter(tag => extractVariableNames(tag.parameter).includes(variableName))
    .map(tag => ({ tagId: tag.tagId, name: tag.name }))
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

export const TRIGGER_TYPE_LABELS: Record<string, string> = {
  pageview: 'Page View',
  domReady: 'DOM Ready',
  windowLoaded: 'Window Loaded',
  click: 'Click - All Elements',
  linkClick: 'Click - Just Links',
  formSubmission: 'Form Submission',
  historyChange: 'History Change',
  jsError: 'JavaScript Error',
  timer: 'Timer',
  customEvent: 'Custom Event',
  elementVisibility: 'Element Visibility',
  scrollDepth: 'Scroll Depth',
  youTubeVideo: 'YouTube Video',
  triggerGroup: 'Trigger Group',
}

export const TRIGGER_TYPE_CATEGORY: Record<string, string> = {
  pageview: 'page',
  domReady: 'page',
  windowLoaded: 'page',
  click: 'interaction',
  linkClick: 'interaction',
  formSubmission: 'interaction',
  historyChange: 'nav',
  jsError: 'error',
  timer: 'engagement',
  customEvent: 'engagement',
  elementVisibility: 'engagement',
  scrollDepth: 'engagement',
  youTubeVideo: 'engagement',
  triggerGroup: 'group',
}

export function triggerLabel(type: string): string {
  return TRIGGER_TYPE_LABELS[type] ?? type
}

export function triggerCategory(type: string): string {
  return TRIGGER_TYPE_CATEGORY[type] ?? 'other'
}

export const VARIABLE_TYPE_LABELS: Record<string, string> = {
  k: '1st Party Cookie',
  j: 'JavaScript Variable',
  d: 'DOM Element',
  v: 'Data Layer Variable',
  jsm: 'Custom JavaScript',
  u: 'URL',
  c: 'Constant',
  aev: 'Auto-Event Variable',
  gas: 'Google Analytics Settings',
  r: 'Random Number',
  smm: 'Lookup Table',
  remm: 'RegEx Table',
  vis: 'Element Visibility',
  ctv: 'Container Version Number',
}

export const VARIABLE_TYPE_CATEGORY: Record<string, string> = {
  k: 'storage',
  j: 'code',
  d: 'dom',
  v: 'datalayer',
  jsm: 'code',
  u: 'url',
  c: 'constant',
  aev: 'dom',
  gas: 'analytics',
  r: 'constant',
  smm: 'lookup',
  remm: 'lookup',
  vis: 'dom',
  ctv: 'constant',
}

export function variableLabel(type: string): string {
  return VARIABLE_TYPE_LABELS[type] ?? type
}

export function variableCategory(type: string): string {
  return VARIABLE_TYPE_CATEGORY[type] ?? 'other'
}
