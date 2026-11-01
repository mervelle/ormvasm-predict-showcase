import {
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import type {
  RawDataFilterOption,
  RawDataFilters,
  RawDataOptions,
} from '../../../types/rawDataTypes'
import {
  EMPTY_RAW_DATA_FILTERS,
} from '../../../types/rawDataTypes'

type FilterKey = keyof RawDataFilters

const URL_FIELDS: Record<FilterKey, string> = {
  provinces: 'province',
  cultures: 'culture',
  types1: 'type_1',
  types2: 'type_2',
}

function allowedValues(
  options: RawDataFilterOption[],
) {
  return new Set(
    options.map((option) => option.value),
  )
}

function uniqueValidValues(
  params: URLSearchParams,
  field: string,
  options: RawDataFilterOption[],
) {
  const allowed = allowedValues(options)

  return [
    ...new Set(params.getAll(field)),
  ].filter((value) => allowed.has(value))
}

function readFilters(
  params: URLSearchParams,
  metadata: RawDataOptions,
): RawDataFilters {
  return {
    ...EMPTY_RAW_DATA_FILTERS,
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
    types1: uniqueValidValues(
      params,
      URL_FIELDS.types1,
      metadata.types_1,
    ),
    types2: uniqueValidValues(
      params,
      URL_FIELDS.types2,
      metadata.types_2,
    ),
  }
}

function writeFilters(
  filters: RawDataFilters,
) {
  const params = new URLSearchParams()

  Object.entries(URL_FIELDS).forEach(
    ([key, field]) => {
      filters[key as FilterKey].forEach(
        (value) => params.append(field, value),
      )
    },
  )

  return params
}

export function useRawDataFilters(
  metadata: RawDataOptions,
) {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const filters = useMemo(
    () => readFilters(searchParams, metadata),
    [metadata, searchParams],
  )

  const canonicalParams = useMemo(
    () => writeFilters(filters),
    [filters],
  )

  useEffect(() => {
    if (
      canonicalParams.toString() !==
      searchParams.toString()
    ) {
      setSearchParams(
        canonicalParams,
        { replace: true },
      )
    }
  }, [
    canonicalParams,
    searchParams,
    setSearchParams,
  ])

  const setFilter = useCallback(
    (
      key: FilterKey,
      values: string[],
    ) => {
      setSearchParams(
        writeFilters({
          ...filters,
          [key]: values,
        }),
      )
    },
    [filters, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  return {
    filters,
    setFilter,
    resetFilters,
  }
}
