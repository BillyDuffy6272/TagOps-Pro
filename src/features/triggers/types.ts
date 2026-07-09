import type { Tables, TablesInsert, TablesUpdate } from '../../types/supabase'

export type Trigger = Tables<'triggers'>
export type TriggerInsert = TablesInsert<'triggers'>
export type TriggerUpdate = TablesUpdate<'triggers'>
export type Container = Tables<'containers'>

export type TriggerType = Trigger['trigger_type']

export const TRIGGER_TYPES: TriggerType[] = [
  'pageview',
  'click',
  'custom_event',
  'form_submit',
  'scroll',
  'timer',
  'history_change',
]

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  pageview: 'Page view',
  click: 'Click',
  custom_event: 'Custom event',
  form_submit: 'Form submit',
  scroll: 'Scroll depth',
  timer: 'Timer',
  history_change: 'History change',
}

export interface Condition {
  var: string
  op: string
  val: string
}

export interface LinkedTag {
  name: string
  relationship: 'fires_on' | 'blocks'
}

export interface TriggerWithTags extends Trigger {
  containerName: string
  tags: LinkedTag[]
}
