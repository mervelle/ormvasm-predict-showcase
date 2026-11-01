import { Database, Info } from 'lucide-react'
import { useState } from 'react'

import {
  useTerritoriesQuery,
  useTerritoryDetailQuery,
} from '../../api/territoryQueries'
import type {
  TerritoryProfile,
  TerritoryTab,
} from '../../types/territoryTypes'
import { TerritoryMap } from './components/TerritoryMap'
import { TerritoryProfilePanel } from './components/TerritoryProfilePanel'
import {
  TerritoryErrorState,
  TerritoryInitialSkeleton,
} from './components/TerritoryStates'
import { useTerritorySelection } from './hooks/useTerritorySelection'
import { formatPeriod } from './territoryFormat'

export function TerritoryScreen() {
  const overviewQuery = useTerritoriesQuery()
  const [activeTab, setActiveTab] = useState<TerritoryTab>('overview')

  const selection = useTerritorySelection(overviewQuery.data?.territories)
  const detailQuery = useTerritoryDetailQuery(selection.selectedSlug)

  if (overviewQuery.isPending) {
    return (
      <div className="territory-screen">
        <header className="territory-page-header">
          <div>
            <span className="territory-kicker">Identité territoriale</span>
            <h1>Territoire agricole</h1>
            <p>Souss-Massa · région et territoires couverts</p>
          </div>
        </header>
        <TerritoryInitialSkeleton />
      </div>
    )
  }

  if (overviewQuery.isError || overviewQuery.data === undefined) {
    return (
      <div className="territory-screen">
        <TerritoryErrorState retry={() => void overviewQuery.refetch()} />
      </div>
    )
  }

  const data = overviewQuery.data
  const selectedTerritory = data.territories.find(
    (item) => item.province_slug === selection.selectedSlug,
  )

  const isRegion = selection.selectedSlug === null
  const profile: TerritoryProfile | null = isRegion
    ? data.region.profile
    : detailQuery.data ?? null

  const title = isRegion
    ? data.region.label
    : selectedTerritory?.province_label ?? 'Territoire'
  const eyebrow = isRegion
    ? 'Région'
    : selectedTerritory?.administrative_type ?? 'Territoire'
  const subtitle = isRegion
    ? data.region.scope_label
    : profile?.coverage.start_campaign && profile.coverage.end_campaign
      ? `Données observées · ${formatPeriod(
          profile.coverage.start_campaign,
          profile.coverage.end_campaign,
        )}`
      : 'Données observées du projet'

  return (
    <div className="territory-screen">
      <header className="territory-page-header">
        <div>
          <span className="territory-kicker">Identité territoriale</span>
          <h1>Territoire agricole</h1>
          <p>Souss-Massa · région et territoires couverts</p>
        </div>
        <div className="territory-source-badge" aria-label="Sources de la page">
          <Database aria-hidden="true" />
          <div>
            <strong>Production · climat</strong>
            <span>
              {formatPeriod(
                data.region.period.start_campaign,
                data.region.period.end_campaign,
              )} · données observées
            </span>
          </div>
        </div>
      </header>

      {selection.isUnknown ? (
        <aside className="territory-url-notice" role="status">
          <Info aria-hidden="true" />
          Le territoire demandé dans l'URL n'est pas couvert. La vue régionale est affichée.
        </aside>
      ) : null}

      <div className="territory-layout">
        <TerritoryProfilePanel
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          profile={profile}
          editorial={isRegion ? data.region.editorial : undefined}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isLoading={!isRegion && detailQuery.isPending}
          isError={!isRegion && detailQuery.isError}
          onRetry={() => void detailQuery.refetch()}
        />

        <TerritoryMap
          geojson={data.geojson}
          territories={data.territories}
          attribution={data.attribution}
          selectedSlug={selection.selectedSlug}
          onSelect={selection.selectTerritory}
        />
      </div>

      <span className="sr-only" aria-live="polite">
        {overviewQuery.isFetching || detailQuery.isFetching
          ? 'Mise à jour des données territoriales.'
          : `Fiche affichée : ${title}.`}
      </span>
    </div>
  )
}
