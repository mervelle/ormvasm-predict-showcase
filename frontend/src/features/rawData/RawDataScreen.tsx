import {
  AlertCircle,
  LoaderCircle,
} from 'lucide-react'
import { useState } from 'react'

import {
  useRawDataExportMutation,
  useRawDataImportMutation,
  useRawDataInfiniteQuery,
  useRawDataOptionsQuery,
} from '../../api/rawDataQueries'
import type {
  RawDataOptions,
} from '../../types/rawDataTypes'
import { RawDataTable } from './components/RawDataTable'
import { RawDataToolbar } from './components/RawDataToolbar'
import { useRawDataFilters } from './hooks/useRawDataFilters'

function saveExcel(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = 'donnees_brutes_ormva.xlsx'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

function RawDataReady({
  metadata,
}: {
  metadata: RawDataOptions
}) {
  const {
    filters,
    setFilter,
    resetFilters,
  } = useRawDataFilters(metadata)

  const dataQuery =
    useRawDataInfiniteQuery(filters)
  const importMutation =
    useRawDataImportMutation()
  const exportMutation =
    useRawDataExportMutation()

  const [feedback, setFeedback] =
    useState<string | null>(null)

  const pages = dataQuery.data?.pages ?? []
  const rows = pages.flatMap(
    (page) => page.rows,
  )
  const columns =
    pages[0]?.columns ?? []
  const total =
    pages[0]?.total ?? 0

  const handleImport = (file: File) => {
    setFeedback(null)

    importMutation.mutate(file, {
      onSuccess: (result) => {
        setFeedback(
          `${result.added_rows} ligne${
            result.added_rows > 1 ? 's' : ''
          } ajoutée${
            result.added_rows > 1 ? 's' : ''
          }.`,
        )
      },
      onError: () => {
        setFeedback(
          "Le fichier n'a pas pu être ajouté. Vérifiez qu'il contient une feuille BD 2 avec les 9 colonnes attendues.",
        )
      },
    })
  }

  const handleExport = () => {
    setFeedback(null)

    exportMutation.mutate(filters, {
      onSuccess: (blob) => {
        saveExcel(blob)
        setFeedback(
          'Export Excel généré.',
        )
      },
      onError: () => {
        setFeedback(
          "L'export Excel n'a pas pu être généré.",
        )
      },
    })
  }

  if (dataQuery.isPending) {
    return (
      <div
        className="raw-data-state"
        role="status"
      >
        <LoaderCircle
          className="raw-data-spinner"
          aria-hidden="true"
        />
        Chargement des données…
      </div>
    )
  }

  if (dataQuery.isError) {
    return (
      <div
        className="raw-data-state raw-data-state--error"
        role="alert"
      >
        <AlertCircle aria-hidden="true" />
        <span>
          Impossible de charger les données brutes.
        </span>
        <button
          type="button"
          onClick={() =>
            dataQuery.refetch()
          }
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <section className="raw-data-surface">
      <RawDataToolbar
        metadata={metadata}
        filters={filters}
        isImporting={
          importMutation.isPending
        }
        isExporting={
          exportMutation.isPending
        }
        feedback={feedback}
        onFilterChange={setFilter}
        onReset={resetFilters}
        onImport={handleImport}
        onExport={handleExport}
      />

      <RawDataTable
        columns={columns}
        rows={rows}
        total={total}
        hasMore={
          dataQuery.hasNextPage
        }
        isLoadingMore={
          dataQuery.isFetchingNextPage
        }
        onLoadMore={() => {
          void dataQuery.fetchNextPage()
        }}
      />
    </section>
  )
}

function RawDataContent() {
  const optionsQuery =
    useRawDataOptionsQuery()

  if (optionsQuery.isPending) {
    return (
      <div
        className="raw-data-state"
        role="status"
      >
        <LoaderCircle
          className="raw-data-spinner"
          aria-hidden="true"
        />
        Chargement…
      </div>
    )
  }

  if (optionsQuery.isError) {
    return (
      <div
        className="raw-data-state raw-data-state--error"
        role="alert"
      >
        <AlertCircle aria-hidden="true" />
        <span>
          Impossible de charger les filtres.
        </span>
        <button
          type="button"
          onClick={() =>
            optionsQuery.refetch()
          }
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <RawDataReady
      metadata={optionsQuery.data}
    />
  )
}

export function RawDataScreen() {
  return (
    <div className="raw-data-screen">
      <header className="raw-data-heading">
        <div>
          <h1>Données brutes ORMVA</h1>
          <p>
            Consultez, filtrez, complétez et exportez les données sources de la feuille BD 2.
          </p>
        </div>
      </header>

      <RawDataContent />
    </div>
  )
}
