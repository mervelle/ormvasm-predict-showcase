import {
  LoaderCircle,
} from 'lucide-react'

import type {
  RawCell,
} from '../../../types/rawDataTypes'

interface RawDataTableProps {
  columns: string[]
  rows: Record<string, RawCell>[]
  total: number
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

function formatCell(value: RawCell) {
  if (
    value === null ||
    value === ''
  ) {
    return '—'
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat(
      'fr-FR',
      {
        maximumFractionDigits: 6,
      },
    ).format(value)
  }

  return String(value)
}

export function RawDataTable({
  columns,
  rows,
  total,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: RawDataTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="raw-data-empty"
        role="status"
      >
        Aucune donnée pour ces filtres.
      </div>
    )
  }

  return (
    <>
      <div
        className="raw-data-table-scroll"
        tabIndex={0}
        aria-label="Tableau des données brutes ORMVA"
      >
        <table className="raw-data-table">
          <caption className="sr-only">
            {`${total} ligne${
              total > 1 ? 's' : ''
            } correspondant aux filtres`}
          </caption>

          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                >
                  {column.trim()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column}>
                    {formatCell(row[column] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="raw-data-more">
          <button
            className="raw-data-button"
            type="button"
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore && (
              <LoaderCircle
                className="raw-data-spinner"
                aria-hidden="true"
                size={16}
              />
            )}
            Afficher plus
          </button>
        </div>
      )}
    </>
  )
}
