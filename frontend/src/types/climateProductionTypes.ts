export const CLIMATE_FACTOR_VALUES = [
  'precipitation',
  'et0',
  'deficit_climatique',
  'ratio_pluie_et0',
  'jours_secs',
  'sequence_seche_max',
  'temperature_moyenne',
  'temperature_max_absolue',
  'jours_tmax_ge_35',
  'stress_thermique_cumule',
  'humidite',
  'rayonnement',
  'vent_moyen_10m',
] as const

export type ClimateFactor = (typeof CLIMATE_FACTOR_VALUES)[number]
export type AgriculturalIndicator = 'production' | 'rendement'

export interface ClimateProductionFilters {
  provinces: string[]
  cultures: string[]
  typesEnvironnement: string[]
  modesIrrigation: string[]
  agriculturalIndicator: AgriculturalIndicator
  climateFactor: ClimateFactor
}

export interface AppliedClimateProductionFilters {
  province: string[]
  culture: string[]
  type_environnement: string[]
  mode_irrigation: string[]
  agricultural_indicator: AgriculturalIndicator
  climate_factor: ClimateFactor
}

export interface ClimateProductionCoverage {
  rows_used: number
  rows_excluded: number
  missing_production: number
  agricultural_points_available: number
  agricultural_points_missing: number
  climate_points_available: number
  climate_points_missing: number
}

export interface AgriculturalMetric {
  value: AgriculturalIndicator
  label: string
  unit: string
}

export interface ClimateFactorMetadata {
  value: ClimateFactor
  label: string
  unit: string
  group: string
  description: string
}

export interface ClimateProductionPoint {
  campagne: string
  annee_debut: number
  agricultural_value: number | null
  climate_value: number | null
  rows_used: number
  missing_production: number
}

export interface ProvinceClimateSeries {
  province: string
  province_label: string
  points: ClimateProductionPoint[]
}

export interface ClimateProductionResponse {
  has_data: boolean
  filters_applied: AppliedClimateProductionFilters
  coverage: ClimateProductionCoverage
  agricultural_metric: AgriculturalMetric
  selected_factor: ClimateFactorMetadata
  available_factors: ClimateFactorMetadata[]
  series: ProvinceClimateSeries[]
}

export const EMPTY_CLIMATE_PRODUCTION_FILTERS: ClimateProductionFilters = {
  provinces: [],
  cultures: [],
  typesEnvironnement: [],
  modesIrrigation: [],
  agriculturalIndicator: 'production',
  climateFactor: 'precipitation',
}
