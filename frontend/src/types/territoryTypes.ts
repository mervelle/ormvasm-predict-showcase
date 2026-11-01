import type { FeatureCollection, Geometry } from 'geojson'

export type TerritoryTab = 'overview' | 'rankings' | 'climate'
export type RankingMetric = 'production' | 'yield'

export interface TerritoryPeriod {
  start_campaign: string | null
  end_campaign: string | null
}

export interface EditorialSource {
  key: string
  source_kind: string
  source_title: string
  source_organization: string
  source_url: string | null
  accessed_at: string
  scope_note: string
}

export interface RegionEditorial {
  paragraph: string
  scope_note: string
  sources: EditorialSource[]
}

export interface TerritoryListItem {
  province_slug: string
  province_label: string
  administrative_type: string
  has_data: boolean
}

export interface AreaExtreme {
  campaign: string
  value_ha: number
  has_tie: boolean
}

export interface AreaBenchmarks {
  average_ha: number | null
  minimum: AreaExtreme | null
  maximum: AreaExtreme | null
  campaigns_available: number
}

export interface RankingItem {
  rank: number
  family: string
  culture: string | null
  label: string
  value: number
  unit: string
  valid_campaigns: number
  covered_area_ha: number
}

export interface MetricRankings {
  production: RankingItem[]
  yield: RankingItem[]
}

export interface TerritoryRankings {
  families: MetricRankings
  cultures: MetricRankings
}

export interface ObservedPractice {
  dominant_value: string | null
  dominant_label: string | null
  dominant_area_ha: number | null
  dominant_share_known_pct: number | null
  known_area_ha: number
  missing_area_ha: number
  missing_share_total_pct: number | null
  total_area_ha: number
}

export interface TerritoryPractices {
  environment: ObservedPractice
  irrigation: ObservedPractice
}

export interface TerritoryCoverage {
  rows_used: number
  rows_excluded: number
  missing_production: number
  campaigns_available: number
  start_campaign: string | null
  end_campaign: string | null
}

export interface TerritoryClimateSummary {
  temperature_mean_c: number | null
  precipitation_median_mm: number | null
  et0_median_mm: number | null
  deficit_median_mm: number | null
  wind_mean_m_s: number | null
  campaigns_available: number
  campaigns_expected: number
  observations_available: number
  observations_expected: number
  territories_available: number
  territories_expected: number
  start_campaign: string | null
  end_campaign: string | null
  source: string
  scope_note: string
}

export interface TerritoryProfile {
  has_data: boolean
  coverage: TerritoryCoverage
  area_benchmarks: AreaBenchmarks
  rankings: TerritoryRankings
  practices: TerritoryPractices
  climate_summary: TerritoryClimateSummary
}

export interface TerritoryGeoProperties {
  province_slug: string
  province_label: string
  administrative_type: string
  source_name: string
  has_production_data: boolean
}

export type TerritoryGeoJSON = FeatureCollection<
  Geometry,
  TerritoryGeoProperties
>

export interface GeoAttribution {
  source_name: string
  source_url: string
  license_name: string
  license_url: string
  source_version: string
  modified: boolean
}

export interface RegionTerritory {
  slug: string
  label: string
  scope_label: string
  period: TerritoryPeriod
  editorial: RegionEditorial
  profile: TerritoryProfile
}

export interface TerritoriesResponse {
  region: RegionTerritory
  territories: TerritoryListItem[]
  geojson: TerritoryGeoJSON
  attribution: GeoAttribution
}

export interface TerritoryDetailResponse extends TerritoryProfile {
  territory: TerritoryListItem
}
