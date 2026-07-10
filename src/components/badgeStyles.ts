const BASE_BADGE =
  'inline-block whitespace-nowrap rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-accent uppercase'

const TAG_CATEGORY_CLASSES: Record<string, string> = {
  'google-ads': 'border-sky-500/20 bg-sky-500/8 text-sky-300',
  analytics: 'border-amber-600/20 bg-amber-600/8 text-amber-300',
  custom: 'border-accent/20 bg-accent/8 text-accent',
  floodlight: 'border-teal-600/20 bg-teal-600/8 text-teal-300',
  social: 'border-pink-600/20 bg-pink-600/8 text-pink-300',
  advertising: 'border-red-600/20 bg-red-600/8 text-red-300',
  other: 'border-gray-500/20 bg-gray-500/8 text-gray-400',
}

const TRIGGER_CATEGORY_CLASSES: Record<string, string> = {
  page: 'border-sky-500/20 bg-sky-500/8 text-sky-300',
  interaction: 'border-accent/20 bg-accent/8 text-accent',
  nav: 'border-violet-500/20 bg-violet-500/8 text-violet-300',
  error: 'border-red-600/20 bg-red-600/8 text-red-300',
  engagement: 'border-amber-600/20 bg-amber-600/8 text-amber-300',
  group: 'border-gray-500/20 bg-gray-500/8 text-gray-400',
  other: 'border-gray-500/20 bg-gray-500/8 text-gray-400',
}

const VARIABLE_CATEGORY_CLASSES: Record<string, string> = {
  storage: 'border-gray-500/20 bg-gray-500/8 text-gray-400',
  code: 'border-accent/20 bg-accent/8 text-accent',
  dom: 'border-violet-500/20 bg-violet-500/8 text-violet-300',
  datalayer: 'border-sky-500/20 bg-sky-500/8 text-sky-300',
  url: 'border-pink-600/20 bg-pink-600/8 text-pink-300',
  constant: 'border-amber-600/20 bg-amber-600/8 text-amber-300',
  analytics: 'border-amber-600/20 bg-amber-600/8 text-amber-300',
  lookup: 'border-teal-600/20 bg-teal-600/8 text-teal-300',
  other: 'border-gray-500/20 bg-gray-500/8 text-gray-400',
}

function badgeClass(map: Record<string, string>, category: string): string {
  return `${BASE_BADGE} ${map[category] ?? map.other}`
}

export const tagBadgeClass = (category: string) => badgeClass(TAG_CATEGORY_CLASSES, category)
export const triggerBadgeClass = (category: string) => badgeClass(TRIGGER_CATEGORY_CLASSES, category)
export const variableBadgeClass = (category: string) => badgeClass(VARIABLE_CATEGORY_CLASSES, category)
