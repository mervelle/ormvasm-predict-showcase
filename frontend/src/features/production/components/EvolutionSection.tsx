import type {
  EvolutionPoint,
  ProductionUnits,
} from '../../../types/productionTypes'
import {
  EvolutionChart,
  type EvolutionMetric,
} from './EvolutionChart'

interface EvolutionSectionProps {
  points: EvolutionPoint[]
  units: ProductionUnits
}

interface ChartDefinition {
  metric: EvolutionMetric
  label: string
  unit: string
}

export function EvolutionSection({ points, units }: EvolutionSectionProps) {
  const charts: ChartDefinition[] = [
    {
      metric: 'production_t',
      label: 'Production',
      unit: units.production_t,
    },
    {
      metric: 'superficie_ha',
      label: 'Superficie',
      unit: units.superficie_ha,
    },
    {
      metric: 'rendement_t_ha',
      label: 'Rendement pondéré',
      unit: units.rendement_t_ha,
    },
  ]

  const firstCampaign = points.at(0)?.campagne
  const lastCampaign = points.at(-1)?.campagne
  const period =
    firstCampaign && lastCampaign
      ? `${firstCampaign}–${lastCampaign}`
      : 'Période indisponible'

  return (
    <section className="evolution-section" aria-labelledby="evolution-title">
      <div className="evolution-section__header">
        <div>
          <h2 id="evolution-title">Évolution par campagne</h2>
          <p>Les trois indicateurs partagent le même périmètre de filtres.</p>
        </div>
        <span>{period}</span>
      </div>

      <div className="evolution-grid">
        {charts.map((chart) => (
          <EvolutionChart
            key={chart.metric}
            points={points}
            metric={chart.metric}
            label={chart.label}
            unit={chart.unit}
          />
        ))}
      </div>
    </section>
  )
}
