import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  EMPTY_PRODUCTION_FILTERS,
  type CultureIndicator,
  type FilterOption,
  type ProductionFilterMetadata,
  type ProductionFilters,
} from '../../../types/productionTypes'

export type ArrayFilterKey = Exclude<
  keyof ProductionFilters,
  'cultureIndicator'
>

const URL_FIELDS: Record<ArrayFilterKey, string> = {
  provinces: 'province',
  cultures: 'culture',
  typesEnvironnement: 'type_environnement',
  modesIrrigation: 'mode_irrigation',
  campagnes: 'campagne',
}

const CULTURE_INDICATORS: CultureIndicator[] = [
  'production',
  'superficie',
  'rendement',
]

function allowedValues(options: FilterOption[]) {
  return new Set(options.map((option) => option.value))
}

function uniqueValidValues(
  params: URLSearchParams,
  field: string,
  options: FilterOption[],
) {
  const allowed = allowedValues(options)
  return [...new Set(params.getAll(field))].filter((value) =>
    allowed.has(value),
  )
}

function readCultureIndicator(params: URLSearchParams): CultureIndicator {
  const value = params.get('culture_indicateur')

  return CULTURE_INDICATORS.includes(value as CultureIndicator)
    ? (value as CultureIndicator)
    : EMPTY_PRODUCTION_FILTERS.cultureIndicator
}

function readFilters(
  params: URLSearchParams,
  metadata: ProductionFilterMetadata,
): ProductionFilters {
  return {
    ...EMPTY_PRODUCTION_FILTERS,
    provinces: uniqueValidValues(
      params,
      URL_FIELDS.provinces,
      metadata.provinces,
    ),
    cultures: uniqueValidValues(
      params,
      URL_FIELDS.cultures,
      metadata.cultures,
    ),
    typesEnvironnement: uniqueValidValues(
      params,
      URL_FIELDS.typesEnvironnement,
      metadata.types_environnement,
    ),
    modesIrrigation: uniqueValidValues(
      params,
      URL_FIELDS.modesIrrigation,
      metadata.modes_irrigation,
    ),
    campagnes: uniqueValidValues(
      params,
      URL_FIELDS.campagnes,
      metadata.campagnes,
    ),
    cultureIndicator: readCultureIndicator(params),
  }
}

function writeFilters(filters: ProductionFilters) {
  const params = new URLSearchParams()

  Object.entries(URL_FIELDS).forEach(([key, field]) => {
    filters[key as ArrayFilterKey].forEach((value) =>
      params.append(field, value),
    )
  })

  // La valeur par défaut est omise pour garder une URL courte et canonique.
  if (
    filters.cultureIndicator !==
    EMPTY_PRODUCTION_FILTERS.cultureIndicator
  ) {
    params.set('culture_indicateur', filters.cultureIndicator)
  }

  return params
}

export function useProductionFilters(metadata: ProductionFilterMetadata) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => readFilters(searchParams, metadata),
    [metadata, searchParams],
  )
  const canonicalParams = useMemo(() => writeFilters(filters), [filters])

  // Nettoie seulement les paramètres inconnus ou dupliqués. L’URL reste la
  // source de vérité des filtres et contrôles partageables.
  useEffect(() => {
    if (canonicalParams.toString() !== searchParams.toString()) {
      setSearchParams(canonicalParams, { replace: true })
    }
  }, [canonicalParams, searchParams, setSearchParams])

  const setFilter = useCallback(
    (key: ArrayFilterKey, values: string[]) => {
      setSearchParams(writeFilters({ ...filters, [key]: values }))
    },
    [filters, setSearchParams],
  )

  const setCultureIndicator = useCallback(
    (cultureIndicator: CultureIndicator) => {
      setSearchParams(writeFilters({ ...filters, cultureIndicator }))
    },
    [filters, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  return {
    filters,
    setFilter,
    setCultureIndicator,
    resetFilters,
  }
}
