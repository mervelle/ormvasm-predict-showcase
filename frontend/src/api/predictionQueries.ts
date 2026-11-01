import { useMutation, useQuery } from '@tanstack/react-query'

import {
  createPrediction,
  fetchPredictionOptions,
} from './predictionApi'

export const predictionQueryKeys = {
  options: ['predictions', 'options'] as const,
}

export function usePredictionOptionsQuery() {
  return useQuery({
    queryKey: predictionQueryKeys.options,
    queryFn: fetchPredictionOptions,
    staleTime: 5 * 60_000,
  })
}

export function usePredictionMutation() {
  return useMutation({
    mutationFn: createPrediction,
  })
}
