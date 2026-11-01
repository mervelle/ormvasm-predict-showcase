import { LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import {
  init,
  use,
  type ECharts,
  type EChartsCoreOption,
} from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import type { EvolutionPoint } from '../../../types/productionTypes'
import {
  formatCompactMetricValue,
  formatMetricValue,
} from '../utils/productionFormatters'

use([LineChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])

export type EvolutionMetric =
  | 'production_t'
  | 'superficie_ha'
  | 'rendement_t_ha'

interface EvolutionChartProps {
  points: EvolutionPoint[]
  metric: EvolutionMetric
  label: string
  unit: string
}

export interface EvolutionChartDatum {
  value: number | null
  campagne: string
  rowsUsed: number
  missingProduction: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEvolutionChartDatum(value: unknown): value is EvolutionChartDatum {
  if (!isRecord(value)) return false

  return (
    (typeof value.value === 'number' || value.value === null) &&
    typeof value.campagne === 'string' &&
    typeof value.rowsUsed === 'number' &&
    typeof value.missingProduction === 'number'
  )
}

function readTooltipDatum(params: unknown) {
  const firstParam = Array.isArray(params) ? params[0] : params

  if (!isRecord(firstParam) || !isEvolutionChartDatum(firstParam.data)) {
    return null
  }

  return firstParam.data
}

export function buildEvolutionChartData(
  points: EvolutionPoint[],
  metric: EvolutionMetric,
): EvolutionChartDatum[] {
  return points.map((point) => ({
    value: point[metric],
    campagne: point.campagne,
    rowsUsed: point.rows_used,
    missingProduction: point.missing_production,
  }))
}

export function findLatestKnownValue(
  points: EvolutionPoint[],
  metric: EvolutionMetric,
) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]

    if (!point) continue

    const value = point[metric]

    if (value !== null) return value
  }

  return null
}

export function formatEvolutionTooltip(
  datum: EvolutionChartDatum,
  label: string,
  unit: string,
) {
  const observations = `${datum.rowsUsed} observation${
    datum.rowsUsed > 1 ? 's' : ''
  }`
  const missing = `${datum.missingProduction} production${
    datum.missingProduction > 1 ? 's' : ''
  } manquante${datum.missingProduction > 1 ? 's' : ''}`

  return [
    datum.campagne,
    `${label} : ${formatMetricValue(datum.value, unit)}`,
    observations,
    missing,
  ].join('\n')
}

export function moveEvolutionKeyboardIndex(
  currentIndex: number,
  key: string,
  pointCount: number,
) {
  if (pointCount <= 0) return null

  if (key === 'Home') return 0
  if (key === 'End') return pointCount - 1

  if (key === 'ArrowLeft') {
    return Math.max(0, currentIndex - 1)
  }

  if (key === 'ArrowRight') {
    return Math.min(pointCount - 1, currentIndex + 1)
  }

  return null
}

export function buildEvolutionChartOption({
  points,
  metric,
  label,
  unit,
}: EvolutionChartProps): EChartsCoreOption {
  const data = buildEvolutionChartData(points, metric)

  return {
    animation: false,
    aria: {
      enabled: true,
      label: {
        description: `${label} par campagne, exprimée en ${unit}.`,
      },
    },
    grid: {
      top: 16,
      right: 14,
      bottom: 42,
      left: 58,
      containLabel: false,
    },
    tooltip: {
      trigger: 'item',
      renderMode: 'richText',
      confine: true,
      padding: 10,
      borderWidth: 1,
      borderColor: '#dce4de',
      backgroundColor: '#ffffff',
      textStyle: {
        color: '#17221e',
        fontFamily: 'Manrope, system-ui, sans-serif',
        fontSize: 12,
        lineHeight: 18,
      },
      formatter: (params: unknown) => {
        const datum = readTooltipDatum(params)
        return datum ? formatEvolutionTooltip(datum, label, unit) : ''
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((point) => point.campagne),
      axisLine: {
        lineStyle: { color: '#dce4de' },
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#69756f',
        fontFamily: 'Manrope, system-ui, sans-serif',
        fontSize: 10,
        hideOverlap: true,
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      splitNumber: 3,
      axisLabel: {
        color: '#69756f',
        fontFamily: 'Manrope, system-ui, sans-serif',
        fontSize: 10,
        formatter: (value: number) =>
          new Intl.NumberFormat('fr-FR', {
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(value),
      },
      splitLine: {
        lineStyle: { color: '#dce4de', type: 'solid' },
      },
    },
    series: [
      {
        name: label,
        type: 'line',
        data,
        connectNulls: false,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          color: '#2f7d4a',
          width: 2.5,
          cap: 'round',
          join: 'round',
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#2f7d4a',
          borderWidth: 2,
        },
        emphasis: {
          scale: 1.25,
          itemStyle: { borderWidth: 2 },
        },
      },
    ],
  }
}

export function EvolutionChart({
  points,
  metric,
  label,
  unit,
}: EvolutionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const data = useMemo(
    () => buildEvolutionChartData(points, metric),
    [metric, points],
  )
  const option = useMemo(
    () => buildEvolutionChartOption({ points, metric, label, unit }),
    [label, metric, points, unit],
  )
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(points.length - 1, 0),
  )
  const latestValue = findLatestKnownValue(points, metric)
  const activeDatum = data[activeIndex]
  const chartDescription = activeDatum
    ? formatEvolutionTooltip(activeDatum, label, unit).replaceAll('\n', '. ')
    : `${label} par campagne, en ${unit}`

  const showTooltip = (index: number) => {
    chartRef.current?.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: index,
    })
  }

  const hideTooltip = () => {
    chartRef.current?.dispatchAction({ type: 'hideTip' })
  }

  const handleFocus = () => {
    if (data.length > 0) showTooltip(activeIndex)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      hideTooltip()
      return
    }

    const nextIndex = moveEvolutionKeyboardIndex(
      activeIndex,
      event.key,
      data.length,
    )

    if (nextIndex === null) return

    event.preventDefault()
    setActiveIndex(nextIndex)
    showTooltip(nextIndex)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = init(container, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    const resizeObserver = new ResizeObserver(() => chart.resize())
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  useEffect(() => {
    setActiveIndex(Math.max(points.length - 1, 0))
  }, [points])

  return (
    <article className="evolution-card">
      <div className="evolution-card__header">
        <div>
          <h3>{label}</h3>
          <p>Dernière valeur disponible</p>
        </div>
        <strong>{formatCompactMetricValue(latestValue, unit)}</strong>
      </div>

      <div
        ref={containerRef}
        className="evolution-chart"
        role="img"
        tabIndex={data.length > 0 ? 0 : undefined}
        aria-keyshortcuts="ArrowLeft ArrowRight Home End Escape"
        aria-label={`${chartDescription}. Utilisez les flèches gauche et droite pour parcourir les campagnes.`}
        onFocus={handleFocus}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
      />
    </article>
  )
}
