const TAG_DOT_CLASSES: Record<string, string> = {
  'google-ads': 'bg-sky-400',
  analytics: 'bg-amber-400',
  custom: 'bg-accent',
  floodlight: 'bg-teal-400',
  social: 'bg-pink-400',
  advertising: 'bg-red-400',
  other: 'bg-gray-400',
}

const TRIGGER_DOT_CLASSES: Record<string, string> = {
  page: 'bg-sky-400',
  interaction: 'bg-accent',
  nav: 'bg-violet-400',
  error: 'bg-red-400',
  engagement: 'bg-amber-400',
  group: 'bg-gray-400',
  other: 'bg-gray-400',
}

const VARIABLE_DOT_CLASSES: Record<string, string> = {
  storage: 'bg-gray-400',
  code: 'bg-accent',
  dom: 'bg-violet-400',
  datalayer: 'bg-sky-400',
  url: 'bg-pink-400',
  constant: 'bg-amber-400',
  analytics: 'bg-amber-400',
  lookup: 'bg-teal-400',
  other: 'bg-gray-400',
}

// Matches the Google Ads UI's own conversion-action categories:
// support.google.com/google-ads/answer/9791434
const CONVERSION_DOT_CLASSES: Record<string, string> = {
  purchase: 'bg-sky-400',
  add_to_cart: 'bg-teal-400',
  begin_checkout: 'bg-violet-400',
  subscribe: 'bg-pink-400',
  qualified_lead: 'bg-amber-400',
  converted_lead: 'bg-amber-400',
  submit_lead_form: 'bg-amber-400',
  book_appointment: 'bg-violet-400',
  sign_up: 'bg-sky-400',
  request_quote: 'bg-amber-400',
  get_directions: 'bg-gray-400',
  outbound_click: 'bg-red-400',
  contact: 'bg-pink-400',
  page_view: 'bg-gray-400',
  other: 'bg-gray-400',
}

interface Props {
  kind: 'tag' | 'trigger' | 'variable' | 'conversion'
  category: string
  label: string
}

const DOT_MAPS = { tag: TAG_DOT_CLASSES, trigger: TRIGGER_DOT_CLASSES, variable: VARIABLE_DOT_CLASSES, conversion: CONVERSION_DOT_CLASSES }

export default function CategoryBadge({ kind, category, label }: Props) {
  const dotClass = DOT_MAPS[kind][category] ?? DOT_MAPS[kind].other
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-white/4 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-text-secondary">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      {label}
    </span>
  )
}
