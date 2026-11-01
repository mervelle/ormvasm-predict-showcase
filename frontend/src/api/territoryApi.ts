import type {
  TerritoriesResponse,
  TerritoryDetailResponse,
} from '../types/territoryTypes'
import { httpClient } from './httpClient'

export function buildTerritoryDetailPath(provinceSlug: string) {
  return `/territories/${encodeURIComponent(provinceSlug)}`
}

export async function getTerritories() {
  const response = await httpClient.get<TerritoriesResponse>('/territories')
  return response.data
}

export async function getTerritoryDetail(provinceSlug: string) {
  const response = await httpClient.get<TerritoryDetailResponse>(
    buildTerritoryDetailPath(provinceSlug),
  )
  return response.data
}
