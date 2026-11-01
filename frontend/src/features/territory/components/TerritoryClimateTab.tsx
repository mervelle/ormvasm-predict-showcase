import {
  CloudRain,
  Droplets,
  Gauge,
  Thermometer,
  Wind,
} from 'lucide-react'

import type { TerritoryClimateSummary } from '../../../types/territoryTypes'
import { formatClimateValue, formatPeriod } from '../territoryFormat'

interface TerritoryClimateTabProps {
  climate: TerritoryClimateSummary
}

export function TerritoryClimateTab({ climate }: TerritoryClimateTabProps) {
  const metrics = [
    {
      label: 'Température moyenne',
      value: formatClimateValue(climate.temperature_mean_c, '°C'),
      icon: <Thermometer aria-hidden="true" />,
    },
    {
      label: 'Précipitations médianes',
      value: formatClimateValue(climate.precipitation_median_mm, 'mm'),
      icon: <CloudRain aria-hidden="true" />,
    },
    {
      label: 'ET0 médiane',
      value: formatClimateValue(climate.et0_median_mm, 'mm'),
      icon: <Droplets aria-hidden="true" />,
    },
    {
      label: 'Déficit médian',
      value: formatClimateValue(climate.deficit_median_mm, 'mm'),
      icon: <Gauge aria-hidden="true" />,
    },
    {
      label: 'Vent moyen à 10 m',
      value: formatClimateValue(climate.wind_mean_m_s, 'm/s'),
      icon: <Wind aria-hidden="true" />,
    },
  ]

  return (
    <div className="territory-tab-content">
      <section className="territory-section territory-climate-section" aria-labelledby="territory-climate-title">
        <div className="territory-section__title territory-section__title--climate">
          <Thermometer aria-hidden="true" />
          <h3 id="territory-climate-title">Résumé climatique représentatif</h3>
        </div>

        <dl className="territory-climate-grid">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt>
                <span className="territory-climate-icon">{metric.icon}</span>
                {metric.label}
              </dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>

        <dl className="territory-climate-meta">
          <div>
            <dt>Période climatique</dt>
            <dd>{formatPeriod(climate.start_campaign, climate.end_campaign)}</dd>
          </div>
          <div>
            <dt>Campagnes</dt>
            <dd>{climate.campaigns_available}/{climate.campaigns_expected}</dd>
          </div>
          <div>
            <dt>Observations</dt>
            <dd>{climate.observations_available}/{climate.observations_expected}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{climate.source}</dd>
          </div>
        </dl>
      </section>

      <aside className="territory-climate-note">
        {climate.scope_note} Ces statistiques sont descriptives et ne démontrent pas une relation causale.
      </aside>
    </div>
  )
}
