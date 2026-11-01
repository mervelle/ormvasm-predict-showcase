import {
  Download,
  LoaderCircle,
  RotateCcw,
  Upload,
} from 'lucide-react'
import {
  useRef,
  type ChangeEvent,
} from 'react'

import type {
  RawDataFilters,
  RawDataOptions,
} from '../../../types/rawDataTypes'
import {
  FilterMultiSelect,
} from '../../production/components/FilterMultiSelect'

type FilterKey = keyof RawDataFilters

interface RawDataToolbarProps {
  metadata: RawDataOptions
  filters: RawDataFilters
  isImporting: boolean
  isExporting: boolean
  feedback: string | null
  onFilterChange: (
    key: FilterKey,
    values: string[],
  ) => void
  onReset: () => void
  onImport: (file: File) => void
  onExport: () => void
}

export function RawDataToolbar({
  metadata,
  filters,
  isImporting,
  isExporting,
  feedback,
  onFilterChange,
  onReset,
  onImport,
  onExport,
}: RawDataToolbarProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const hasFilters =
    filters.provinces.length > 0 ||
    filters.cultures.length > 0 ||
    filters.types1.length > 0 ||
    filters.types2.length > 0

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.currentTarget.files?.[0]

    if (file) {
      onImport(file)
    }

    event.currentTarget.value = ''
  }

  return (
    <div className="raw-data-toolbar">
      <div className="raw-data-toolbar__filters">
        <FilterMultiSelect
          id="raw-filter-province"
          label="Province"
          allLabel="Toutes"
          options={metadata.provinces}
          selectedValues={filters.provinces}
          onChange={(values) =>
            onFilterChange(
              'provinces',
              values,
            )
          }
        />

        <FilterMultiSelect
          id="raw-filter-culture"
          label="Culture"
          allLabel="Toutes"
          options={metadata.cultures}
          selectedValues={filters.cultures}
          searchable
          onChange={(values) =>
            onFilterChange(
              'cultures',
              values,
            )
          }
        />

        <FilterMultiSelect
          id="raw-filter-type-1"
          label="Type 1"
          allLabel="Tous"
          options={metadata.types_1}
          selectedValues={filters.types1}
          onChange={(values) =>
            onFilterChange(
              'types1',
              values,
            )
          }
        />

        <FilterMultiSelect
          id="raw-filter-type-2"
          label="Type 2"
          allLabel="Tous"
          options={metadata.types_2}
          selectedValues={filters.types2}
          onChange={(values) =>
            onFilterChange(
              'types2',
              values,
            )
          }
        />
      </div>

      <div className="raw-data-toolbar__actions">
        {hasFilters && (
          <button
            className="raw-data-button raw-data-button--ghost"
            type="button"
            onClick={onReset}
          >
            <RotateCcw
              aria-hidden="true"
              size={15}
            />
            Réinitialiser
          </button>
        )}

        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
        />

        <button
          className="raw-data-button"
          type="button"
          disabled={isImporting}
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          {isImporting ? (
            <LoaderCircle
              className="raw-data-spinner"
              aria-hidden="true"
              size={16}
            />
          ) : (
            <Upload
              aria-hidden="true"
              size={16}
            />
          )}
          Ajouter des données
        </button>

        <button
          className="raw-data-button raw-data-button--primary"
          type="button"
          disabled={isExporting}
          onClick={onExport}
        >
          {isExporting ? (
            <LoaderCircle
              className="raw-data-spinner"
              aria-hidden="true"
              size={16}
            />
          ) : (
            <Download
              aria-hidden="true"
              size={16}
            />
          )}
          Exporter
        </button>
      </div>

      <p
        className="raw-data-toolbar__feedback"
        aria-live="polite"
      >
        {feedback ?? ''}
      </p>
    </div>
  )
}
