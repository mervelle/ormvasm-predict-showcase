import type {
  ClimateProductionFilters,
  ClimateProductionResponse,
} from '../types/climateProductionTypes'
import { httpClient } from './httpClient'

function appendRepeated(
  params: URLSearchParams,
  name: string,
  values: readonly string[],
) {
  values.forEach((value) => params.append(name, value))
}

export function buildClimateProductionSearchParams(
  filters: ClimateProductionFilters,
) {
  const params = new URLSearchParams()

  appendRepeated(params, 'province', filters.provinces)
  appendRepeated(params, 'culture', filters.cultures)
  appendRepeated(params, 'type_environnement', filters.typesEnvironnement)
  appendRepeated(params, 'mode_irrigation', filters.modesIrrigation)
  params.set('agricultural_indicator', filters.agriculturalIndicator)
  params.set('climate_factor', filters.climateFactor)

  return params
}

export async function getClimateProductionSeries(
  filters: ClimateProductionFilters,
) {
  const response = await httpClient.get<ClimateProductionResponse>(
    '/climate-production/series',
    { params: buildClimateProductionSearchParams(filters) },
  )
  return response.data
}
