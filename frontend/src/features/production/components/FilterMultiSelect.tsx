import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import type { FilterOption } from '../../../types/productionTypes'

interface FilterMultiSelectProps {
  id: string
  label: string
  allLabel: string
  options: FilterOption[]
  selectedValues: string[]
  searchable?: boolean
  onChange: (values: string[]) => void
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
}

export function FilterMultiSelect({
  id,
  label,
  allLabel,
  options,
  selectedValues,
  searchable = false,
  onChange,
}: FilterMultiSelectProps) {
  const [search, setSearch] = useState('')
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const selected = new Set(selectedValues)
  const visibleOptions = useMemo(() => {
    const query = normalizeSearch(search.trim())
    if (!query) return options
    return options.filter((option) => normalizeSearch(option.label).includes(query))
  }, [options, search])

  const summary =
    selectedValues.length === 0
      ? allLabel
      : selectedValues.length === 1
        ? options.find((option) => option.value === selectedValues[0])?.label ?? allLabel
        : `${selectedValues.length} sélectionnés`

  const toggleValue = (value: string) => {
    onChange(
      selected.has(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value],
    )
  }

  useEffect(() => {
    const closeWhenClickingOutside = (event: PointerEvent) => {
      const details = detailsRef.current

      // pointerdown couvre la souris, le stylet et le toucher sur écran tactile.
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false
      }
    }

    document.addEventListener('pointerdown', closeWhenClickingOutside)
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside)
  }, [])

  const closeWithEscape = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== 'Escape') return

    const details = detailsRef.current
    if (!details?.open) return

    details.open = false
    details.querySelector('summary')?.focus()
  }

  return (
    <div className="production-filter">
      <span className="production-filter__label" id={`${id}-label`}>
        {label}
      </span>
      <details
        ref={detailsRef}
        className="production-filter__details"
        onKeyDown={closeWithEscape}
      >
        <summary aria-labelledby={`${id}-label ${id}-summary`}>
          <span id={`${id}-summary`}>{summary}</span>
        </summary>
        <div className="production-filter__panel">
          {searchable && (
            <label className="production-filter__search">
              <Search aria-hidden="true" size={15} />
              <span className="sr-only">Rechercher une culture</span>
              <input
                type="search"
                value={search}
                placeholder="Rechercher…"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          )}

          <div className="production-filter__options">
            {visibleOptions.map((option) => (
              <label key={option.value} className="production-filter__option">
                <input
                  type="checkbox"
                  checked={selected.has(option.value)}
                  onChange={() => toggleValue(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
            {visibleOptions.length === 0 && (
              <p className="production-filter__no-result">Aucune culture trouvée.</p>
            )}
          </div>

          {selectedValues.length > 0 && (
            <button
              className="production-filter__clear"
              type="button"
              onClick={() => onChange([])}
            >
              <X aria-hidden="true" size={14} />
              Effacer ce filtre
            </button>
          )}
        </div>
      </details>
    </div>
  )
}
