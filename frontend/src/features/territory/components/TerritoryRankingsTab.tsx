import type { ReactNode } from 'react'
import { BarChart3, Layers3, Sprout } from 'lucide-react'

import type {
  RankingItem,
  RankingMetric,
  TerritoryRankings,
} from '../../../types/territoryTypes'
import { formatArea, formatRankingValue } from '../territoryFormat'

interface TerritoryRankingsTabProps {
  rankings: TerritoryRankings
  metric: RankingMetric
  onMetricChange: (metric: RankingMetric) => void
}

function RankingList({
  title,
  items,
  metric,
  icon,
}: {
  title: string
  items: RankingItem[]
  metric: RankingMetric
  icon: ReactNode
}) {
  const maxValue = items[0]?.value && items[0].value > 0 ? items[0].value : 1

  return (
    <section className="territory-ranking-group">
      <div className="territory-section__title">
        {icon}
        <h3>{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="territory-inline-empty">Aucun groupe admissible pour ce classement.</p>
      ) : (
        <ol className="territory-ranking-list">
          {items.map((item) => (
            <li key={`${item.family}-${item.culture ?? 'family'}-${item.rank}`}>
              <div className="territory-ranking-row__head">
                <span>
                  <b>{item.rank}</b>
                  {item.label}
                </span>
                <strong>{formatRankingValue(item.value, item.unit)}</strong>
              </div>
              <progress
                className="territory-ranking-progress"
                value={item.value}
                max={maxValue}
                aria-hidden="true"
              />
              <div className="territory-ranking-row__meta">
                <span>{item.valid_campaigns} campagnes valides</span>
                {metric === 'yield' ? (
                  <span>{formatArea(item.covered_area_ha)} couverts</span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function TerritoryRankingsTab({
  rankings,
  metric,
  onMetricChange,
}: TerritoryRankingsTabProps) {
  const families = rankings.families[metric]
  const cultures = rankings.cultures[metric]

  return (
    <div className="territory-tab-content">
      <div className="territory-ranking-toolbar">
        <span>Classement</span>
        <div className="territory-segmented-control" aria-label="Indicateur du classement">
          <button
            type="button"
            aria-pressed={metric === 'production'}
            onClick={() => onMetricChange('production')}
          >
            Production
          </button>
          <button
            type="button"
            aria-pressed={metric === 'yield'}
            onClick={() => onMetricChange('yield')}
          >
            Rendement
          </button>
        </div>
      </div>

      <RankingList
        title="Familles"
        items={families}
        metric={metric}
        icon={<Layers3 aria-hidden="true" />}
      />
      <RankingList
        title="Cultures"
        items={cultures}
        metric={metric}
        icon={<Sprout aria-hidden="true" />}
      />

      {metric === 'yield' ? (
        <aside className="territory-data-note">
          <BarChart3 aria-hidden="true" />
          <span>
            Le rendement est pondéré. Le classement exige au moins trois campagnes valides ;
            la superficie couverte est indiquée pour chaque rang.
          </span>
        </aside>
      ) : null}
    </div>
  )
}
