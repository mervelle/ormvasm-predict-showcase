import { useQuery } from '@tanstack/react-query'

import {
  getProductionFilterMetadata,
  getProductionOverview,
} from './productionApi'
import type { ProductionFilters } from '../types/productionTypes'

export const productionQueryKeys = {
  all: ['production'] as const,
  metadata: () => [...productionQueryKeys.all, 'metadata'] as const,
  overview: (filters: ProductionFilters) =>
    [...productionQueryKeys.all, 'overview', filters] as const,
}

export function useProductionFilterMetadataQuery() {
  return useQuery({
    queryKey: productionQueryKeys.metadata(),
    queryFn: getProductionFilterMetadata,
  })
}

export function useProductionOverviewQuery(
  filters: ProductionFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: productionQueryKeys.overview(filters),
    queryFn: () => getProductionOverview(filters),
    enabled,
  })
}
