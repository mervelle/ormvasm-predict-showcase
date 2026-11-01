export type CultureIndicator = 'production' | 'superficie' | 'rendement'

export interface FilterOption {
  value: string
  label: string
}

export interface ProductionUnits {
  production_t: string
  superficie_ha: string
  rendement_t_ha: string
  part_pct: string
}

export interface ProductionFilterMetadata {
  provinces: FilterOption[]
  cultures: FilterOption[]
  campagnes: FilterOption[]
  types_environnement: FilterOption[]
  modes_irrigation: FilterOption[]
  units: ProductionUnits
}

export interface ProductionFilters {
  provinces: string[]
  cultures: string[]
  typesEnvironnement: string[]
  modesIrrigation: string[]
  campagnes: string[]
  cultureIndicator: CultureIndicator
}

export interface Coverage {
  rows_used: number
  rows_excluded: number
  missing_production: number
}

export interface EvolutionPoint {
  campagne: string
  annee_debut: number
  production_t: number | null
  superficie_ha: number | null
  rendement_t_ha: number | null
  rows_used: number
  missing_production: number
}

export interface CategoryDistributionItem {
  value: string
  superficie_ha: number
  part_pct: number
}

export interface CultureDistributionItem {
  culture: string
  value: number | null
  part_pct: number | null
  rows_used: number
  missing_production: number
}

export interface AppliedProductionFilters {
  province: string[] | null
  culture: string[] | null
  type_environnement: string[] | null
  mode_irrigation: string[] | null
  campagne: string[] | null
  culture_indicateur: CultureIndicator
}

export interface ProductionOverview {
  has_data: boolean
  filters_applied: AppliedProductionFilters
  coverage: Coverage
  evolution: EvolutionPoint[]
  environment_distribution: CategoryDistributionItem[]
  irrigation_distribution: CategoryDistributionItem[]
  culture_distribution: CultureDistributionItem[]
}

export const EMPTY_PRODUCTION_FILTERS: ProductionFilters = {
  provinces: [],
  cultures: [],
  typesEnvironnement: [],
  modesIrrigation: [],
  campagnes: [],
  cultureIndicator: 'production',
}
