import { useQuery } from '@tanstack/react-query'

import { getTerritories, getTerritoryDetail } from './territoryApi'

export const territoryQueryKeys = {
  all: ['territories'] as const,
  overview: () => [...territoryQueryKeys.all, 'overview'] as const,
  detail: (provinceSlug: string) =>
    [...territoryQueryKeys.all, 'detail', provinceSlug] as const,
}

export function useTerritoriesQuery() {
  return useQuery({
    queryKey: territoryQueryKeys.overview(),
    queryFn: getTerritories,
  })
}

export function useTerritoryDetailQuery(provinceSlug: string | null) {
  return useQuery({
    queryKey: territoryQueryKeys.detail(provinceSlug ?? 'none'),
    queryFn: async () => {
      if (provinceSlug === null) {
        throw new Error('Territoire requis pour cette requête.')
      }
      return getTerritoryDetail(provinceSlug)
    },
    enabled: provinceSlug !== null,
  })
}
