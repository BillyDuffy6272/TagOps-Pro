import type { Tables, TablesInsert, TablesUpdate } from '../../types/supabase'

export type Variable = Tables<'variables'>
export type VariableInsert = TablesInsert<'variables'>
export type VariableUpdate = TablesUpdate<'variables'>
export type Container = Tables<'containers'>

export type VariableType = Variable['variable_type']

export const VARIABLE_TYPES: VariableType[] = [
  'datalayer',
  'constant',
  'url',
  'cookie',
  'dom_element',
  'custom_js',
]

export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  datalayer: 'Data layer',
  constant: 'Constant',
  url: 'URL',
  cookie: 'Cookie',
  dom_element: 'DOM element',
  custom_js: 'Custom JS',
}

export interface VariableWithContainer extends Variable {
  containerName: string
}
