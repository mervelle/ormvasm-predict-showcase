import type { CSSProperties } from 'react'

import type {
  CultureDistributionItem,
  CultureIndicator,
  FilterOption,
} from '../../../types/productionTypes'
import {
  formatMetricValue,
  formatPercentage,
} from '../utils/productionFormatters'

interface CultureRankingProps {
  items: CultureDistributionItem[]
  indicator: CultureIndicator
  cultureOptions: FilterOption[]
  selectedCultures: string[]
  unit: string
  percentageUnit: string
}

export interface CultureRankingRow extends CultureDistributionItem {
  label: string
  color: string
  renderedPartPct: number
}

type CultureBarStyle = CSSProperties & {
  '--culture-bar-color': string
  '--culture-bar-size': string
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function resolveCultureLabel(
  culture: string,
  cultureOptions: FilterOption[],
  selectedCultures: string[],
) {
  if (culture === 'selection') {
    return selectedCultures.length > 1
      ? 'Cultures sélectionnées'
      : 'Culture sélectionnée'
  }

  if (culture === 'autres') {
    return selectedCultures.length > 0 ? 'Autres cultures' : 'Autres'
  }

  return (
    cultureOptions.find((option) => option.value === culture)?.label ?? culture
  )
}

function resolveCultureColor(culture: string) {
  if (culture === 'selection') return '#1d5545'
  if (culture === 'autres') return '#8aa096'
  return '#2f7d4a'
}

export function buildCultureRankingRows(
  items: CultureDistributionItem[],
  indicator: CultureIndicator,
  cultureOptions: FilterOption[],
  selectedCultures: string[],
): CultureRankingRow[] {
  const maximumYield =
    indicator === 'rendement'
      ? Math.max(0, ...items.map((item) => item.value ?? 0))
      : 0

  // L’ordre reçu est déjà le classement métier calculé par l’API.
  return items.map((item) => {
    const renderedPartPct =
      indicator === 'rendement'
        ? item.value !== null && maximumYield > 0
          ? clampPercentage((item.value / maximumYield) * 100)
          : 0
        : clampPercentage(item.part_pct ?? 0)

    return {
      ...item,
      label: resolveCultureLabel(
        item.culture,
        cultureOptions,
        selectedCultures,
      ),
      color: resolveCultureColor(item.culture),
      renderedPartPct,
    }
  })
}

export function formatCultureRowDescription(
  row: CultureRankingRow,
  indicator: CultureIndicator,
  unit: string,
  percentageUnit: string,
) {
  const observations = `${row.rows_used} observation${
    row.rows_used > 1 ? 's' : ''
  }`
  const missing = `${row.missing_production} production${
    row.missing_production > 1 ? 's' : ''
  } manquante${row.missing_production > 1 ? 's' : ''}`
  const contribution =
    indicator !== 'rendement' && row.part_pct !== null
      ? `, ${formatPercentage(row.part_pct, percentageUnit)}`
      : ''

  return `${row.label} : ${formatMetricValue(
    row.value,
    unit,
  )}${contribution}, ${observations}, ${missing}`
}

export function calculateSelectedYieldGap(
  items: CultureDistributionItem[],
) {
  const selection = items.find((item) => item.culture === 'selection')
  const others = items.find((item) => item.culture === 'autres')

  if (
    selection?.value === null ||
    selection?.value === undefined ||
    others?.value === null ||
    others?.value === undefined
  ) {
    return null
  }

  // Les deux rendements sont déjà pondérés par l’API. Cette soustraction sert
  // uniquement à présenter l’écart demandé par le guide fonctionnel.
  return selection.value - others.value
}

export function CultureRanking({
  items,
  indicator,
  cultureOptions,
  selectedCultures,
  unit,
  percentageUnit,
}: CultureRankingProps) {
  const rows = buildCultureRankingRows(
    items,
    indicator,
    cultureOptions,
    selectedCultures,
  )

  if (selectedCultures.length > 0 && indicator !== 'rendement') {
    return (
      <div className="culture-contribution">
        <div
          className="culture-contribution__track"
          role="group"
          aria-label="Contribution de la sélection et des autres cultures"
        >
          {rows.map((row, index) => {
            const tooltipId = `culture-contribution-tooltip-${index}`
            const description = formatCultureRowDescription(
              row,
              indicator,
              unit,
              percentageUnit,
            )
            const style: CultureBarStyle = {
              '--culture-bar-color': row.color,
              '--culture-bar-size': `${row.renderedPartPct}%`,
            }

            return (
              <button
                key={`${row.culture}-${index}`}
                type="button"
                className="culture-contribution__segment"
                style={style}
                aria-label={description}
                aria-describedby={tooltipId}
              >
                <span
                  id={tooltipId}
                  className="culture-ranking__tooltip"
                  role="tooltip"
                >
                  <strong>{row.label}</strong>
                  <span>{formatMetricValue(row.value, unit)}</span>
                  {row.part_pct !== null && (
                    <span>
                      {formatPercentage(row.part_pct, percentageUnit)}
                    </span>
                  )}
                  <span>
                    {row.rows_used} observation{row.rows_used > 1 ? 's' : ''}
                  </span>
                  <span>
                    {row.missing_production} production
                    {row.missing_production > 1 ? 's' : ''} manquante
                    {row.missing_production > 1 ? 's' : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <ul className="culture-contribution__legend">
          {rows.map((row, index) => (
            <li key={`${row.culture}-${index}`}>
              <span
                className="culture-contribution__dot"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              <span>{row.label}</span>
              <strong>{formatMetricValue(row.value, unit)}</strong>
              {row.part_pct !== null && (
                <span>{formatPercentage(row.part_pct, percentageUnit)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ol className="culture-ranking">
      {rows.map((row, index) => {
        const tooltipId = `culture-ranking-tooltip-${index}`
        const description = formatCultureRowDescription(
          row,
          indicator,
          unit,
          percentageUnit,
        )
        const style: CultureBarStyle = {
          '--culture-bar-color': row.color,
          '--culture-bar-size': `${row.renderedPartPct}%`,
        }

        return (
          <li key={`${row.culture}-${index}`}>
            <span className="culture-ranking__position" aria-hidden="true">
              {index + 1}
            </span>
            <span className="culture-ranking__label">{row.label}</span>

            <div
              className="culture-ranking__bar"
              style={style}
              role="img"
              tabIndex={0}
              aria-label={description}
              aria-describedby={tooltipId}
            >
              <span className="culture-ranking__fill" aria-hidden="true" />
              <span
                id={tooltipId}
                className="culture-ranking__tooltip"
                role="tooltip"
              >
                <strong>{row.label}</strong>
                <span>{formatMetricValue(row.value, unit)}</span>
                {indicator !== 'rendement' && row.part_pct !== null && (
                  <span>
                    {formatPercentage(row.part_pct, percentageUnit)}
                  </span>
                )}
                <span>
                  {row.rows_used} observation{row.rows_used > 1 ? 's' : ''}
                </span>
                <span>
                  {row.missing_production} production
                  {row.missing_production > 1 ? 's' : ''} manquante
                  {row.missing_production > 1 ? 's' : ''}
                </span>
              </span>
            </div>

            <span className="culture-ranking__value">
              <strong>{formatMetricValue(row.value, unit)}</strong>
              {indicator !== 'rendement' && row.part_pct !== null && (
                <span>{formatPercentage(row.part_pct, percentageUnit)}</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
