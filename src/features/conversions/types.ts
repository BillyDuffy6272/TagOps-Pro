import type { Tables, TablesInsert, TablesUpdate } from '../../types/supabase'

export type ConversionEvent = Tables<'conversion_events'>
export type ConversionEventInsert = TablesInsert<'conversion_events'>
export type ConversionEventUpdate = TablesUpdate<'conversion_events'>
export type Container = Tables<'containers'>

export interface ConversionEventWithContainer extends ConversionEvent {
  containerName: string
  containerGoogleAdsConversionId: string | null
}

export type ConversionCategory = ConversionEvent['category']

// Order matches the Google Ads UI's own conversion-action grouping:
// support.google.com/google-ads/answer/9791434
export const CONVERSION_CATEGORIES: { value: ConversionCategory; label: string }[] = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'add_to_cart', label: 'Add to cart' },
  { value: 'begin_checkout', label: 'Begin checkout' },
  { value: 'subscribe', label: 'Subscribe' },
  { value: 'qualified_lead', label: 'Qualified lead' },
  { value: 'converted_lead', label: 'Converted lead' },
  { value: 'submit_lead_form', label: 'Submit lead form' },
  { value: 'book_appointment', label: 'Book appointment' },
  { value: 'sign_up', label: 'Sign up' },
  { value: 'request_quote', label: 'Request quote' },
  { value: 'get_directions', label: 'Get directions' },
  { value: 'outbound_click', label: 'Outbound click' },
  { value: 'contact', label: 'Contact' },
  { value: 'page_view', label: 'Page view' },
  { value: 'other', label: 'Other' },
]

export function conversionCategoryLabel(category: ConversionCategory): string {
  return CONVERSION_CATEGORIES.find(c => c.value === category)?.label ?? category
}
