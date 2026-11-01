import { RotateCcw, X } from 'lucide-react'

import type {
  FilterOption,
  ProductionFilterMetadata,
  ProductionFilters,
} from '../../../types/productionTypes'
import { FilterMultiSelect } from './FilterMultiSelect'

type ArrayFilterKey = Exclude<keyof ProductionFilters, 'cultureIndicator'>

interface ProductionFilterBarProps {
  metadata: ProductionFilterMetadata
  filters: ProductionFilters
  onFilterChange: (key: ArrayFilterKey, values: string[]) => void
  onReset: () => void
}

interface FilterDefinition {
  key: ArrayFilterKey
  label: string
  allLabel: string
  options: FilterOption[]
  searchable?: boolean
}

export function ProductionFilterBar({
  metadata,
  filters,
  onFilterChange,
  onReset,
}: ProductionFilterBarProps) {
  const definitions: FilterDefinition[] = [
    { key: 'provinces', label: 'Province', allLabel: 'Toutes', options: metadata.provinces },
    {
      key: 'cultures',
      label: 'Culture',
      allLabel: 'Toutes',
      options: metadata.cultures,
      searchable: true,
    },
    {
      key: 'typesEnvironnement',
      label: 'Environnement',
      allLabel: 'Tous',
      options: metadata.types_environnement,
    },
    {
      key: 'modesIrrigation',
      label: 'Irrigation',
      allLabel: 'Tous',
      options: metadata.modes_irrigation,
    },
  ]

  const activeFilters = definitions.flatMap((definition) =>
    filters[definition.key].map((value) => ({
      key: definition.key,
      value,
      label:
        definition.options.find((option) => option.value === value)?.label ?? value,
    })),
  )

  const removeActiveFilter = (key: ArrayFilterKey, value: string) => {
    onFilterChange(
      key,
      filters[key].filter((item) => item !== value),
    )
  }

  return (
    <section className="production-filters" aria-label="Filtres de production">
      <div className="production-filters__grid">
        {definitions.map((definition) => (
          <FilterMultiSelect
            id={`filter-${definition.key}`}
            key={definition.key}
            label={definition.label}
            allLabel={definition.allLabel}
            options={definition.options}
            selectedValues={filters[definition.key]}
            searchable={definition.searchable}
            onChange={(values) => onFilterChange(definition.key, values)}
          />
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="production-filters__active" aria-label="Filtres actifs">
          <div className="production-filters__chips">
            {activeFilters.map((filter) => (
              <button
                className="production-filter-chip"
                key={`${filter.key}-${filter.value}`}
                type="button"
                aria-label={`Retirer le filtre ${filter.label}`}
                onClick={() => removeActiveFilter(filter.key, filter.value)}
              >
                {filter.label}
                <X aria-hidden="true" size={13} />
              </button>
            ))}
          </div>
          <button className="production-filters__reset" type="button" onClick={onReset}>
            <RotateCcw aria-hidden="true" size={15} />
            Réinitialiser
          </button>
        </div>
      )}
    </section>
  )
}
