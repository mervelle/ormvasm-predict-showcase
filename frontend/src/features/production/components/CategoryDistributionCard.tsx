import type { CSSProperties } from 'react'

import type {
  CategoryDistributionItem,
  FilterOption,
} from '../../../types/productionTypes'
import {
  formatMetricValue,
  formatPercentage,
} from '../utils/productionFormatters'

type DistributionKind = 'environment' | 'irrigation'

interface CategoryDistributionCardProps {
  kind: DistributionKind
  title: string
  items: CategoryDistributionItem[]
  options: FilterOption[]
  areaUnit: string
  percentageUnit: string
}

export interface DistributionSegment extends CategoryDistributionItem {
  label: string
  color: string
  renderedPartPct: number
}

type DistributionSegmentStyle = CSSProperties & {
  '--distribution-color': string
  '--distribution-size': string
}

function normalizeCategory(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function resolveDistributionColor(value: string) {
  const normalizedValue = normalizeCategory(value)

  if (normalizedValue === 'plein champ' || normalizedValue === 'irrigue') {
    return '#1d5545'
  }

  if (normalizedValue === 'sous serre' || normalizedValue === 'bour') {
    return '#dff08d'
  }

  if (
    normalizedValue === 'non-renseigne' ||
    normalizedValue === 'non renseigne'
  ) {
    return '#cbd4ce'
  }

  // Une éventuelle nouvelle catégorie reste visible sans recevoir une
  // signification métier inventée dans le frontend.
  return '#8aa096'
}

export function resolveDistributionLabel(
  value: string,
  options: FilterOption[],
) {
  return options.find((option) => option.value === value)?.label ?? value
}

function clampPercentageForRendering(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function buildDistributionSegments(
  items: CategoryDistributionItem[],
  options: FilterOption[],
): DistributionSegment[] {
  // L’ordre et les valeurs métier restent ceux de l’API.
  return items.map((item) => ({
    ...item,
    label: resolveDistributionLabel(item.value, options),
    color: resolveDistributionColor(item.value),
    renderedPartPct: clampPercentageForRendering(item.part_pct),
  }))
}

export function formatDistributionDescription(
  segment: DistributionSegment,
  areaUnit: string,
  percentageUnit: string,
) {
  return `${segment.label} : ${formatPercentage(
    segment.part_pct,
    percentageUnit,
  )}, ${formatMetricValue(segment.superficie_ha, areaUnit)}`
}

export function CategoryDistributionCard({
  kind,
  title,
  items,
  options,
  areaUnit,
  percentageUnit,
}: CategoryDistributionCardProps) {
  const segments = buildDistributionSegments(items, options)

  return (
    <article className="distribution-card">
      <div className="distribution-card__header">
        <div>
          <h3>{title}</h3>
          <p>Part de la superficie totale</p>
        </div>
      </div>

      {segments.length === 0 ? (
        <p className="distribution-card__empty">
          Répartition indisponible pour ce périmètre.
        </p>
      ) : (
        <>
          <div
            className="distribution-track"
            role="group"
            aria-label={`Répartition ${title.toLowerCase()}`}
          >
            {segments.map((segment, index) => {
              const tooltipId = `${kind}-distribution-tooltip-${index}`
              const description = formatDistributionDescription(
                segment,
                areaUnit,
                percentageUnit,
              )
              const style: DistributionSegmentStyle = {
                '--distribution-color': segment.color,
                '--distribution-size': `${segment.renderedPartPct}%`,
              }

              return (
                <button
                  key={segment.value}
                  type="button"
                  className="distribution-segment"
                  style={style}
                  aria-label={description}
                  aria-describedby={tooltipId}
                >
                  <span
                    id={tooltipId}
                    className="distribution-segment__tooltip"
                    role="tooltip"
                  >
                    <strong>{segment.label}</strong>
                    <span>
                      {formatPercentage(segment.part_pct, percentageUnit)}
                    </span>
                    <span>{formatMetricValue(segment.superficie_ha, areaUnit)}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <ul className="distribution-legend" aria-label={`Légende ${title}`}>
            {segments.map((segment) => (
              <li key={segment.value}>
                <span
                  className="distribution-legend__dot"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                <span>{segment.label}</span>
                <strong>
                  {formatPercentage(segment.part_pct, percentageUnit)}
                </strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}
