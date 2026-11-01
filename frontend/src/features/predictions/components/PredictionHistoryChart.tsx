import {
  LineChart,
  ScatterChart,
} from 'echarts/charts'
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
  PredictionHistoryPoint,
  PredictionResponse,
} from '../../../types/predictionTypes'
import { formatMetricValue } from '../../production/utils/productionFormatters'

use([
  LineChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  AriaComponent,
  CanvasRenderer,
])

interface PredictionHistoryChartProps {
  result: PredictionResponse
}

interface PredictionChartDatum {
  value: number
  campagne: string
  status: 'Observé' | 'Prédit'
  rowsUsed?: number
  missingProduction?: number
}

interface AccessibleChartPoint {
  seriesIndex: number
  dataIndex: number
  description: string
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPredictionChartDatum(
  value: unknown,
): value is PredictionChartDatum {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.value === 'number' &&
    typeof value.campagne === 'string' &&
    (value.status === 'Observé' ||
      value.status === 'Prédit')
  )
}

function readTooltipDatum(
  params: unknown,
): PredictionChartDatum | null {
  const entries = Array.isArray(params)
    ? params
    : [params]

  for (const entry of entries) {
    if (
      !isRecord(entry) ||
      !isPredictionChartDatum(entry.data)
    ) {
      continue
    }

    return entry.data
  }

  return null
}

function formatPredictionTooltip(
  datum: PredictionChartDatum,
) {
  const lines = [
    datum.status,
    `Campagne : ${datum.campagne}`,
    `Production : ${formatMetricValue(
      datum.value,
      't',
      0,
    )}`,
  ]

  if (
    datum.status === 'Observé' &&
    typeof datum.rowsUsed === 'number'
  ) {
    lines.push(
      `${datum.rowsUsed} observation${
        datum.rowsUsed > 1 ? 's' : ''
      } utilisée${
        datum.rowsUsed > 1 ? 's' : ''
      }`,
    )
  }

  if (
    datum.status === 'Observé' &&
    typeof datum.missingProduction === 'number' &&
    datum.missingProduction > 0
  ) {
    lines.push(
      `${datum.missingProduction} production${
        datum.missingProduction > 1 ? 's' : ''
      } manquante${
        datum.missingProduction > 1 ? 's' : ''
      }`,
    )
  }

  return lines.join('\n')
}

function buildCategories(
  history: PredictionHistoryPoint[],
  campaign: string,
) {
  const categories = history.map(
    (point) => point.campagne,
  )

  if (!categories.includes(campaign)) {
    categories.push(campaign)
  }

  return categories
}

function buildObservedData(
  history: PredictionHistoryPoint[],
) {
  return history.map((point) => {
    if (point.production_t === null) {
      return null
    }

    return {
      value: point.production_t,
      campagne: point.campagne,
      status: 'Observé' as const,
      rowsUsed: point.rows_used,
      missingProduction: point.missing_production,
    }
  })
}

function buildPredictionData(
  categories: string[],
  campaign: string,
  production: number,
) {
  return categories.map((category) => {
    if (category !== campaign) {
      return null
    }

    return {
      value: production,
      campagne: campaign,
      status: 'Prédit' as const,
    }
  })
}

export function buildPredictionHistoryChartOption(
  result: PredictionResponse,
): EChartsCoreOption {
  const categories = buildCategories(
    result.history.series,
    result.scenario.campagne,
  )

  return {
    animation: false,
    grid: {
      left: 58,
      right: 24,
      top: 42,
      bottom: 48,
      containLabel: false,
    },
    aria: {
      enabled: true,
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 18,
      itemHeight: 8,
      textStyle: {
        color: '#69756f',
        fontFamily:
          'Manrope, system-ui, sans-serif',
        fontSize: 11,
      },
    },
    tooltip: {
      trigger: 'item',
      renderMode: 'richText',
      formatter: (params: unknown) => {
        const datum = readTooltipDatum(params)

        return datum
          ? formatPredictionTooltip(datum)
          : ''
      },
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: true,
      axisLine: {
        lineStyle: {
          color: '#dce4de',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#69756f',
        fontFamily:
          'Manrope, system-ui, sans-serif',
        fontSize: 10,
        hideOverlap: true,
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      splitNumber: 4,
      axisLabel: {
        color: '#69756f',
        fontFamily:
          'Manrope, system-ui, sans-serif',
        fontSize: 10,
        formatter: (value: number) =>
          new Intl.NumberFormat('fr-FR', {
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(value),
      },
      splitLine: {
        lineStyle: {
          color: '#dce4de',
          type: 'solid',
        },
      },
    },
    series: [
      {
        name: 'Observations',
        type: 'line',
        data: buildObservedData(
          result.history.series,
        ),
        connectNulls: false,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          color: '#2f7d4a',
          width: 2.5,
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#2f7d4a',
          borderWidth: 2,
        },
        emphasis: {
          scale: 1.2,
        },
      },
      {
        name: 'Prédiction',
        type: 'scatter',
        data: buildPredictionData(
          categories,
          result.scenario.campagne,
          result.prediction.production_t,
        ),
        symbol: 'diamond',
        symbolSize: 14,
        itemStyle: {
          color: '#3e7fa6',
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        emphasis: {
          scale: 1.25,
        },
      },
    ],
  }
}

function buildAccessiblePoints(
  result: PredictionResponse,
) {
  const points: AccessibleChartPoint[] = []

  result.history.series.forEach(
    (point, dataIndex) => {
      if (point.production_t === null) {
        return
      }

      points.push({
        seriesIndex: 0,
        dataIndex,
        description: formatPredictionTooltip({
          value: point.production_t,
          campagne: point.campagne,
          status: 'Observé',
          rowsUsed: point.rows_used,
          missingProduction:
            point.missing_production,
        }).replaceAll('\n', '. '),
      })
    },
  )

  const categories = buildCategories(
    result.history.series,
    result.scenario.campagne,
  )
  const predictionIndex = categories.indexOf(
    result.scenario.campagne,
  )

  points.push({
    seriesIndex: 1,
    dataIndex: predictionIndex,
    description: formatPredictionTooltip({
      value: result.prediction.production_t,
      campagne: result.scenario.campagne,
      status: 'Prédit',
    }).replaceAll('\n', '. '),
  })

  return points
}

function moveChartIndex(
  current: number,
  key: string,
  length: number,
) {
  if (length === 0) {
    return null
  }

  if (key === 'ArrowRight') {
    return Math.min(current + 1, length - 1)
  }

  if (key === 'ArrowLeft') {
    return Math.max(current - 1, 0)
  }

  if (key === 'Home') {
    return 0
  }

  if (key === 'End') {
    return length - 1
  }

  return null
}

export function PredictionHistoryChart({
  result,
}: PredictionHistoryChartProps) {
  const containerRef =
    useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const descriptionId = useId()
  const accessiblePoints = useMemo(
    () => buildAccessiblePoints(result),
    [result],
  )
  const option = useMemo(
    () => buildPredictionHistoryChartOption(result),
    [result],
  )
  const [activeIndex, setActiveIndex] =
    useState(() =>
      Math.max(accessiblePoints.length - 1, 0),
    )

  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(accessiblePoints.length - 1, 0),
  )
  const activePoint =
    accessiblePoints[safeActiveIndex]

  const showTooltip = (index: number) => {
    const point = accessiblePoints[index]

    if (!point) {
      return
    }

    chartRef.current?.dispatchAction({
      type: 'showTip',
      seriesIndex: point.seriesIndex,
      dataIndex: point.dataIndex,
    })
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      chartRef.current?.dispatchAction({
        type: 'hideTip',
      })
      return
    }

    const nextIndex = moveChartIndex(
      safeActiveIndex,
      event.key,
      accessiblePoints.length,
    )

    if (nextIndex === null) {
      return
    }

    event.preventDefault()
    setActiveIndex(nextIndex)
    showTooltip(nextIndex)
  }

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const chart = init(
      container,
      undefined,
      {
        renderer: 'canvas',
      },
    )
    chartRef.current = chart

    const resizeObserver = new ResizeObserver(
      () => chart.resize(),
    )
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, {
      notMerge: true,
    })
  }, [option])


  const firstCampaign =
    result.history.series.at(0)?.campagne
  const lastCampaign =
    result.history.series.at(-1)?.campagne

  return (
    <section
      className="prediction-chart-card"
      aria-labelledby="prediction-chart-title"
    >
      <div className="prediction-section-heading">
        <div>
          <h2 id="prediction-chart-title">
            Historique de la combinaison et prédiction
          </h2>
          <p>
            {result.history.has_data &&
            firstCampaign &&
            lastCampaign
              ? `Observations ${firstCampaign}–${lastCampaign}, puis estimation pour ${result.scenario.campagne}.`
              : `Estimation pour ${result.scenario.campagne}.`}
          </p>
        </div>
      </div>

      {result.history.has_data ? (
        <>
          <div
            ref={containerRef}
            className="prediction-history-chart"
            role="img"
            tabIndex={0}
            aria-label={`Production observée pour ${result.scenario.province_label} et ${result.scenario.culture_label}, avec prédiction pour ${result.scenario.campagne}`}
            aria-describedby={descriptionId}
            onFocus={() =>
              showTooltip(safeActiveIndex)
            }
            onBlur={() =>
              chartRef.current?.dispatchAction({
                type: 'hideTip',
              })
            }
            onKeyDown={handleKeyDown}
          />
          <p
            id={descriptionId}
            className="sr-only"
            aria-live="polite"
          >
            {activePoint?.description ??
              'Graphique de production par campagne.'}
          </p>
          <p className="prediction-chart-help">
            Utilisez les flèches gauche et droite
            pour parcourir les points du graphique.
          </p>
        </>
      ) : (
        <div className="prediction-no-history">
          <strong>
            Aucun historique direct disponible
          </strong>
          <p>
            La prédiction reste disponible, mais
            aucun repère historique ne peut être
            affiché pour cette combinaison.
          </p>
        </div>
      )}
    </section>
  )
}
