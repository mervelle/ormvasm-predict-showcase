import type {
  RawDataFilters,
  RawDataImportResult,
  RawDataOptions,
  RawDataPage,
} from '../types/rawDataTypes'
import { httpClient } from './httpClient'

export const RAW_DATA_PAGE_SIZE = 50

function appendRepeated(
  params: URLSearchParams,
  name: string,
  values: readonly string[],
) {
  values.forEach((value) =>
    params.append(name, value),
  )
}

export function buildRawDataSearchParams(
  filters: RawDataFilters,
) {
  const params = new URLSearchParams()

  appendRepeated(
    params,
    'province',
    filters.provinces,
  )
  appendRepeated(
    params,
    'culture',
    filters.cultures,
  )
  appendRepeated(
    params,
    'type_1',
    filters.types1,
  )
  appendRepeated(
    params,
    'type_2',
    filters.types2,
  )

  return params
}

export async function getRawDataOptions() {
  const response =
    await httpClient.get<RawDataOptions>(
      '/raw-data/options',
    )

  return response.data
}

export async function getRawDataPage(
  filters: RawDataFilters,
  offset: number,
) {
  const params =
    buildRawDataSearchParams(filters)

  params.set('offset', String(offset))
  params.set(
    'limit',
    String(RAW_DATA_PAGE_SIZE),
  )

  const response =
    await httpClient.get<RawDataPage>(
      '/raw-data',
      { params },
    )

  return response.data
}

export async function importRawData(
  file: File,
) {
  const body = new FormData()
  body.append('file', file)

  const response =
    await httpClient.post<RawDataImportResult>(
      '/raw-data/import',
      body,
    )

  return response.data
}

export async function exportRawData(
  filters: RawDataFilters,
) {
  const response = await httpClient.get<Blob>(
    '/raw-data/export',
    {
      params:
        buildRawDataSearchParams(filters),
      responseType: 'blob',
    },
  )

  return response.data
}
