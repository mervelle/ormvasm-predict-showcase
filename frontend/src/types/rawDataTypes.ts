export type RawCell =
  | string
  | number
  | boolean
  | null

export interface RawDataFilterOption {
  value: string
  label: string
}

export interface RawDataOptions {
  provinces: RawDataFilterOption[]
  cultures: RawDataFilterOption[]
  types_1: RawDataFilterOption[]
  types_2: RawDataFilterOption[]
}

export interface RawDataFilters {
  provinces: string[]
  cultures: string[]
  types1: string[]
  types2: string[]
}

export interface RawDataPage {
  columns: string[]
  rows: Record<string, RawCell>[]
  total: number
  offset: number
  limit: number
  next_offset: number | null
}

export interface RawDataImportResult {
  added_rows: number
  total_rows: number
}

export const EMPTY_RAW_DATA_FILTERS: RawDataFilters = {
  provinces: [],
  cultures: [],
  types1: [],
  types2: [],
}
