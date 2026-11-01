import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { TerritoryListItem } from '../../../types/territoryTypes'

export function useTerritorySelection(
  territories: readonly TerritoryListItem[] | undefined,
) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSlug = searchParams.get('territory')

  const knownSlugs = useMemo(
    () => new Set(territories?.map((item) => item.province_slug) ?? []),
    [territories],
  )

  const isResolved = territories !== undefined
  const isUnknown =
    isResolved && requestedSlug !== null && !knownSlugs.has(requestedSlug)
  const selectedSlug =
    requestedSlug !== null && knownSlugs.has(requestedSlug)
      ? requestedSlug
      : null

  const selectTerritory = useCallback(
    (provinceSlug: string | null) => {
      const next = new URLSearchParams(searchParams)
      if (provinceSlug === null) {
        next.delete('territory')
      } else {
        next.set('territory', provinceSlug)
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  return {
    requestedSlug,
    selectedSlug,
    isUnknown,
    selectTerritory,
  }
}
