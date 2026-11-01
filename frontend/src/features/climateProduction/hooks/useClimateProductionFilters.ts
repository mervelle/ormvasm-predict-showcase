import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  CLIMATE_FACTOR_VALUES,
  EMPTY_CLIMATE_PRODUCTION_FILTERS,
  type AgriculturalIndicator,
  type ClimateFactor,
  type ClimateProductionFilters,
} from '../../../types/climateProductionTypes'
import type {
  FilterOption,
  ProductionFilterMetadata,
} from '../../../types/productionTypes'

export type ClimateGlobalFilterKey =
  | 'provinces'
  | 'cultures'
  | 'typesEnvironnement'
  | 'modesIrrigation'

const URL_FIELDS: Record<ClimateGlobalFilterKey, string> = {
  provinces: 'province',
  cultures: 'culture',
  typesEnvironnement: 'type_environnement',
  modesIrrigation: 'mode_irrigation',
}

const AGRICULTURAL_INDICATORS: AgriculturalIndicator[] = [
  'production',
  'rendement',
]

function uniqueValidValues(
  params: URLSearchParams,
  field: string,
  options: FilterOption[],
) {
  const allowed = new Set(options.map((option) => option.value))
  return [...new Set(params.getAll(field))].filter((value) =>
    allowed.has(value),
  )
}

function readAgriculturalIndicator(
  params: URLSearchParams,
): AgriculturalIndicator {
  const value = params.get('agricultural_indicator')
  return AGRICULTURAL_INDICATORS.includes(value as AgriculturalIndicator)
    ? (value as AgriculturalIndicator)
    : EMPTY_CLIMATE_PRODUCTION_FILTERS.agriculturalIndicator
}

function readClimateFactor(params: URLSearchParams): ClimateFactor {
  const value = params.get('climate_factor')
  return CLIMATE_FACTOR_VALUES.includes(value as ClimateFactor)
    ? (value as ClimateFactor)
    : EMPTY_CLIMATE_PRODUCTION_FILTERS.climateFactor
}

function readFilters(
  params: URLSearchParams,
  metadata: ProductionFilterMetadata,
): ClimateProductionFilters {
  return {
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
    agriculturalIndicator: readAgriculturalIndicator(params),
    climateFactor: readClimateFactor(params),
  }
}

function writeFilters(filters: ClimateProductionFilters) {
  const params = new URLSearchParams()

  Object.entries(URL_FIELDS).forEach(([key, field]) => {
    filters[key as ClimateGlobalFilterKey].forEach((value) =>
      params.append(field, value),
    )
  })

  if (
    filters.agriculturalIndicator !==
    EMPTY_CLIMATE_PRODUCTION_FILTERS.agriculturalIndicator
  ) {
    params.set('agricultural_indicator', filters.agriculturalIndicator)
  }

  if (
    filters.climateFactor !==
    EMPTY_CLIMATE_PRODUCTION_FILTERS.climateFactor
  ) {
    params.set('climate_factor', filters.climateFactor)
  }

  return params
}

export function useClimateProductionFilters(
  metadata: ProductionFilterMetadata,
) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => readFilters(searchParams, metadata),
    [metadata, searchParams],
  )
  const canonicalParams = useMemo(() => writeFilters(filters), [filters])

  useEffect(() => {
    if (canonicalParams.toString() !== searchParams.toString()) {
      setSearchParams(canonicalParams, { replace: true })
    }
  }, [canonicalParams, searchParams, setSearchParams])

  const setGlobalFilter = useCallback(
    (key: ClimateGlobalFilterKey, values: string[]) => {
      setSearchParams(writeFilters({ ...filters, [key]: values }))
    },
    [filters, setSearchParams],
  )

  const setAgriculturalIndicator = useCallback(
    (agriculturalIndicator: AgriculturalIndicator) => {
      setSearchParams(writeFilters({ ...filters, agriculturalIndicator }))
    },
    [filters, setSearchParams],
  )

  const setClimateFactor = useCallback(
    (climateFactor: ClimateFactor) => {
      setSearchParams(writeFilters({ ...filters, climateFactor }))
    },
    [filters, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  return {
    filters,
    setGlobalFilter,
    setAgriculturalIndicator,
    setClimateFactor,
    resetFilters,
  }
}
