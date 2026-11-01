import { httpClient } from './httpClient'
import type {
  ProductionFilterMetadata,
  ProductionFilters,
  ProductionOverview,
} from '../types/productionTypes'

function appendRepeated(
  params: URLSearchParams,
  name: string,
  values: readonly string[],
) {
  values.forEach((value) => params.append(name, value))
}

export function buildProductionSearchParams(filters: ProductionFilters) {
  const params = new URLSearchParams()

  appendRepeated(params, 'province', filters.provinces)
  appendRepeated(params, 'culture', filters.cultures)
  appendRepeated(params, 'type_environnement', filters.typesEnvironnement)
  appendRepeated(params, 'mode_irrigation', filters.modesIrrigation)
  appendRepeated(params, 'campagne', filters.campagnes)
  params.set('culture_indicateur', filters.cultureIndicator)

  return params
}

export async function getProductionFilterMetadata() {
  const response = await httpClient.get<ProductionFilterMetadata>('/metadata/filters')
  return response.data
}

export async function getProductionOverview(filters: ProductionFilters) {
  const response = await httpClient.get<ProductionOverview>('/production/overview', {
    params: buildProductionSearchParams(filters),
  })
  return response.data
}
