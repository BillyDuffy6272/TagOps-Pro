import type { Tables, TablesInsert, TablesUpdate } from '../../types/supabase'

export type ConversionEvent = Tables<'conversion_events'>
export type ConversionEventInsert = TablesInsert<'conversion_events'>
export type ConversionEventUpdate = TablesUpdate<'conversion_events'>
export type Container = Tables<'containers'>

export interface ConversionEventWithContainer extends ConversionEvent {
  containerName: string
}
