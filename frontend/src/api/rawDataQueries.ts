import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  RawDataFilters,
} from '../types/rawDataTypes'
import {
  exportRawData,
  getRawDataOptions,
  getRawDataPage,
  importRawData,
} from './rawDataApi'

export const rawDataQueryKeys = {
  all: ['raw-data'] as const,
  options: () =>
    [...rawDataQueryKeys.all, 'options'] as const,
  list: (filters: RawDataFilters) =>
    [...rawDataQueryKeys.all, 'list', filters] as const,
}

export function useRawDataOptionsQuery() {
  return useQuery({
    queryKey: rawDataQueryKeys.options(),
    queryFn: getRawDataOptions,
  })
}

export function useRawDataInfiniteQuery(
  filters: RawDataFilters,
) {
  return useInfiniteQuery({
    queryKey: rawDataQueryKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getRawDataPage(
        filters,
        pageParam,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.next_offset ?? undefined,
  })
}

export function useRawDataImportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importRawData,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: rawDataQueryKeys.all,
      })
    },
  })
}

export function useRawDataExportMutation() {
  return useMutation({
    mutationFn: exportRawData,
  })
}
