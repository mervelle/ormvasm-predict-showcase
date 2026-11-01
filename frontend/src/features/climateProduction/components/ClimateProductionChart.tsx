import { LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
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
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import type {
  AgriculturalMetric,
  ClimateFactorMetadata,
  ClimateProductionPoint,
  ProvinceClimateSeries,
} from '../../../types/climateProductionTypes'
import { formatMetricValue } from '../../production/utils/productionFormatters'

use([
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  AriaComponent,
  CanvasRenderer,
])

interface ClimateProductionChartProps {
  series: ProvinceClimateSeries
  agriculturalMetric: AgriculturalMetric
  climateFactor: ClimateFactorMetadata
  compact?: boolean
}

interface ChartDatum {
  value: number | null
  point: ClimateProductionPoint
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTooltipPoint(params: unknown) {
  const entries = Array.isArray(params) ? params : [params]

  for (const entry of entries) {
    if (!isRecord(entry) || !isRecord(entry.data)) continue
    const datum = entry.data as unknown as ChartDatum
    if (isRecord(datum.point) && typeof datum.point.campagne === 'string') {
      return datum.point
    }
  }

  return null
}

export function formatClimateProductionTooltip(
  point: ClimateProductionPoint,
  agriculturalMetric: AgriculturalMetric,
  climateFactor: ClimateFactorMetadata,
) {
  const observations = `${point.rows_used} observation${
    point.rows_used > 1 ? 's' : ''
  }`
  const missing = `${point.missing_production} production${
    point.missing_production > 1 ? 's' : ''
  } manquante${point.missing_production > 1 ? 's' : ''}`

  return [
    point.campagne,
    `${agriculturalMetric.label} : ${formatMetricValue(
      point.agricultural_value,
      agriculturalMetric.unit,
    )}`,
    `${climateFactor.label} : ${formatMetricValue(
      point.climate_value,
      climateFactor.unit,
    )}`,
    observations,
    missing,
  ].join('\n')
}

export function moveClimateChartIndex(
  currentIndex: number,
  key: string,
  pointCount: number,
) {
  if (pointCount <= 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return pointCount - 1
  if (key === 'ArrowLeft') return Math.max(0, currentIndex - 1)
  if (key === 'ArrowRight') {
    return Math.min(pointCount - 1, currentIndex + 1)
  }
  return null
}

export function buildClimateProductionChartOption(
  series: ProvinceClimateSeries,
  agriculturalMetric: AgriculturalMetric,
  climateFactor: ClimateFactorMetadata,
): EChartsCoreOption {
  const agriculturalData: ChartDatum[] = series.points.map((point) => ({
    value: point.agricultural_value,
    point,
  }))
  const climateData: ChartDatum[] = series.points.map((point) => ({
    value: point.climate_value,
    point,
  }))

  return {
    animation: false,
    aria: {
      enabled: true,
      label: {
        description: `${agriculturalMetric.label} et ${climateFactor.label} par campagne pour ${series.province_label}.`,
      },
    },
    grid: {
      top: 46,
      right: 66,
      bottom: 48,
      left: 66,
    },
    legend: {
      top: 4,
      itemWidth: 22,
      itemHeight: 8,
      textStyle: {
        color: '#69756f',
        fontFamily: 'Manrope, system-ui, sans-serif',
        fontSize: 11,
      },
    },
    tooltip: {
      trigger: 'axis',
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
        const point = readTooltipPoint(params)
        return point
          ? formatClimateProductionTooltip(
              point,
              agriculturalMetric,
              climateFactor,
            )
          : ''
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: series.points.map((point) => point.campagne),
      axisLine: { lineStyle: { color: '#dce4de' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#69756f',
        fontFamily: 'Manrope, system-ui, sans-serif',
        fontSize: 10,
        hideOverlap: true,
        margin: 12,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: agriculturalMetric.unit,
        min: 0,
        nameTextStyle: {
          color: '#2f7d4a',
          fontSize: 10,
        },
        axisLabel: {
          color: '#69756f',
          fontSize: 10,
          formatter: (value: number) =>
            new Intl.NumberFormat('fr-FR', {
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value),
        },
        splitLine: { lineStyle: { color: '#dce4de' } },
      },
      {
        type: 'value',
        name: climateFactor.unit,
        scale: true,
        nameTextStyle: {
          color: '#3e7fa6',
          fontSize: 10,
        },
        axisLabel: {
          color: '#69756f',
          fontSize: 10,
          formatter: (value: number) =>
            new Intl.NumberFormat('fr-FR', {
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value),
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: agriculturalMetric.label,
        type: 'line',
        yAxisIndex: 0,
        data: agriculturalData,
        connectNulls: false,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#2f7d4a', width: 3 },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#2f7d4a',
          borderWidth: 2,
        },
      },
      {
        name: climateFactor.label,
        type: 'line',
        yAxisIndex: 1,
        data: climateData,
        connectNulls: false,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#3e7fa6',
          width: 2.5,
          type: 'dashed',
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#3e7fa6',
          borderWidth: 2,
        },
      },
    ],
  }
}

export function ClimateProductionChart({
  series,
  agriculturalMetric,
  climateFactor,
  compact = false,
}: ClimateProductionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const descriptionId = useId()
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(series.points.length - 1, 0),
  )
  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(series.points.length - 1, 0),
  )
  const activePoint = series.points[safeActiveIndex]
  const description = activePoint
    ? formatClimateProductionTooltip(
        activePoint,
        agriculturalMetric,
        climateFactor,
      ).replaceAll('\n', '. ')
    : `Aucune campagne disponible pour ${series.province_label}.`
  const option = useMemo(
    () =>
      buildClimateProductionChartOption(
        series,
        agriculturalMetric,
        climateFactor,
      ),
    [agriculturalMetric, climateFactor, series],
  )

  const showTooltip = (index: number) => {
    chartRef.current?.dispatchAction({
      type: 'showTip',
      seriesIndex: 1,
      dataIndex: index,
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      chartRef.current?.dispatchAction({ type: 'hideTip' })
      return
    }

    const nextIndex = moveClimateChartIndex(
      safeActiveIndex,
      event.key,
      series.points.length,
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

  return (
    <article
      className={`climate-chart-card${
        compact ? ' climate-chart-card--compact' : ''
      }`}
    >
      <header className="climate-chart-card__heading">
        <div>
          <h3>{series.province_label}</h3>
          <p>{series.points.length} campagnes</p>
        </div>
      </header>

      <div
        ref={containerRef}
        className="climate-chart"
        tabIndex={0}
        role="img"
        aria-label={`${agriculturalMetric.label} et ${climateFactor.label} par campagne pour ${series.province_label}`}
        aria-describedby={descriptionId}
        onFocus={() => showTooltip(safeActiveIndex)}
        onBlur={() =>
          chartRef.current?.dispatchAction({ type: 'hideTip' })
        }
        onKeyDown={handleKeyDown}
      />
      <p id={descriptionId} className="visually-hidden" aria-live="polite">
        {description}
      </p>
    </article>
  )
}
