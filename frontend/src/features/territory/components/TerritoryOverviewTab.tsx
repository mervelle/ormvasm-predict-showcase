import type { ReactNode } from 'react'
import {
  CircleAlert,
  LandPlot,
  Maximize2,
  Minimize2,
  Sprout,
  Waves,
} from 'lucide-react'

import type {
  RegionEditorial,
  TerritoryProfile,
} from '../../../types/territoryTypes'
import {
  formatArea,
  formatPercentage,
} from '../territoryFormat'

interface TerritoryOverviewTabProps {
  profile: TerritoryProfile
  editorial?: RegionEditorial
}

function PracticeRow({
  title,
  practice,
  icon,
}: {
  title: string
  practice: TerritoryProfile['practices']['environment']
  icon: ReactNode
}) {
  return (
    <div className="territory-practice-row">
      <span className="territory-row-icon" aria-hidden="true">{icon}</span>
      <div className="territory-practice-row__copy">
        <strong>{title}</strong>
        <span>Par superficie renseignée</span>
      </div>
      <div className="territory-practice-row__value">
        <strong>{practice.dominant_label ?? 'Donnée indisponible'}</strong>
        <span>
          {formatPercentage(practice.dominant_share_known_pct)} parmi les données renseignées
        </span>
      </div>
    </div>
  )
}

export function TerritoryOverviewTab({
  profile,
  editorial,
}: TerritoryOverviewTabProps) {
  const { area_benchmarks: area, practices, coverage } = profile

  return (
    <div className="territory-tab-content">
      {editorial ? (
        <section className="territory-editorial" aria-labelledby="territory-editorial-title">
          <h3 id="territory-editorial-title">Contexte régional</h3>
          <p>{editorial.paragraph}</p>
          <p className="territory-editorial__scope">{editorial.scope_note}</p>
          <details className="territory-editorial-sources">
            <summary>Sources du contexte régional</summary>
            <ul>
              {editorial.sources.map((source) => (
                <li key={source.key}>
                  {source.source_url ? (
                    <a href={source.source_url} target="_blank" rel="noreferrer">
                      {source.source_organization} — {source.source_title}
                    </a>
                  ) : (
                    <span>{source.source_organization} — {source.source_title}</span>
                  )}
                  <small>Consulté le {source.accessed_at}</small>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}

      <section className="territory-section" aria-labelledby="territory-area-title">
        <div className="territory-section__title">
          <LandPlot aria-hidden="true" />
          <h3 id="territory-area-title">Repères de superficie</h3>
        </div>

        <div className="territory-stat-list">
          <div className="territory-stat-row">
            <span className="territory-row-icon" aria-hidden="true"><LandPlot /></span>
            <div>
              <span>Moyenne par campagne</span>
              <small>{area.campaigns_available} campagnes</small>
            </div>
            <strong>{formatArea(area.average_ha)}</strong>
          </div>

          <div className="territory-stat-row">
            <span className="territory-row-icon" aria-hidden="true"><Minimize2 /></span>
            <div>
              <span>Superficie minimale</span>
              <small>
                {area.minimum?.campaign ?? 'Période indisponible'}
                {area.minimum?.has_tie ? ' · égalité' : ''}
              </small>
            </div>
            <strong>{formatArea(area.minimum?.value_ha ?? null)}</strong>
          </div>

          <div className="territory-stat-row">
            <span className="territory-row-icon" aria-hidden="true"><Maximize2 /></span>
            <div>
              <span>Superficie maximale</span>
              <small>
                {area.maximum?.campaign ?? 'Période indisponible'}
                {area.maximum?.has_tie ? ' · égalité' : ''}
              </small>
            </div>
            <strong>{formatArea(area.maximum?.value_ha ?? null)}</strong>
          </div>
        </div>
      </section>

      <section className="territory-section" aria-labelledby="territory-practices-title">
        <div className="territory-section__title">
          <Sprout aria-hidden="true" />
          <h3 id="territory-practices-title">Pratiques observées</h3>
        </div>
        <p className="territory-section__hint">Lecture descriptive par superficie renseignée.</p>

        <div className="territory-practice-list">
          <PracticeRow
            title="Environnement dominant observé"
            practice={practices.environment}
            icon={<Sprout />}
          />
          <PracticeRow
            title="Irrigation dominante observée"
            practice={practices.irrigation}
            icon={<Waves />}
          />
          <div className="territory-practice-row territory-practice-row--coverage">
            <span className="territory-row-icon" aria-hidden="true"><CircleAlert /></span>
            <div className="territory-practice-row__copy">
              <strong>Données non renseignées</strong>
              <span>Part de la superficie totale</span>
            </div>
            <div className="territory-practice-row__value">
              <span>Environnement {formatPercentage(practices.environment.missing_share_total_pct)}</span>
              <span>Irrigation {formatPercentage(practices.irrigation.missing_share_total_pct)}</span>
            </div>
          </div>
        </div>
      </section>

      <aside className="territory-data-note">
        <CircleAlert aria-hidden="true" />
        <span>
          {coverage.missing_production} production(s) manquante(s) sur {coverage.rows_used} lignes utilisées.
          « Observé » ne signifie pas « recommandé ».
        </span>
      </aside>
    </div>
  )
}
