import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ClimateProductionFilters } from '../types/climateProductionTypes'
import { getClimateProductionSeries } from './climateProductionApi'

export const climateProductionQueryKeys = {
  all: ['climate-production'] as const,
  series: (filters: ClimateProductionFilters) =>
    [...climateProductionQueryKeys.all, 'series', filters] as const,
}

export function useClimateProductionSeriesQuery(
  filters: ClimateProductionFilters,
) {
  return useQuery({
    queryKey: climateProductionQueryKeys.series(filters),
    queryFn: () => getClimateProductionSeries(filters),
    placeholderData: keepPreviousData,
  })
}
