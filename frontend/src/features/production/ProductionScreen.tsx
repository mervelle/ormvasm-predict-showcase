import {
  useProductionFilterMetadataQuery,
  useProductionOverviewQuery,
} from '../../api/productionQueries'
import type {
  Coverage,
  CultureIndicator,
  ProductionFilterMetadata,
  ProductionFilters,
} from '../../types/productionTypes'
import { CultureDistributionSection } from './components/CultureDistributionSection'
import { EvolutionSection } from './components/EvolutionSection'
import { ProductionDistributions } from './components/ProductionDistributions'
import { ProductionFilterBar } from './components/ProductionFilterBar'
import {
  CoverageNotice,
  ProductionContentSkeleton,
  ProductionDashboardSkeleton,
  ProductionEmptyState,
  ProductionErrorState,
} from './components/ProductionStates'
import { useProductionFilters } from './hooks/useProductionFilters'

interface ProductionHeaderProps {
  coverage?: Coverage | null
}

function ProductionHeader({
  coverage = null,
}: ProductionHeaderProps) {
  return (
    <header className="production-heading">
      <div>
        <p className="production-heading__kicker">
          Production agricole
        </p>
        <h1>Historique de la production agricole</h1>
        <p>Souss-Massa · campagnes 2010/2011 à 2021/2022</p>
      </div>

      {coverage && <CoverageNotice coverage={coverage} />}
    </header>
  )
}

function ProductionScreenContent() {
  const metadataQuery = useProductionFilterMetadataQuery()

  if (metadataQuery.isPending) {
    return (
      <>
        <ProductionHeader />
        <ProductionDashboardSkeleton />
      </>
    )
  }

  if (metadataQuery.isError) {
    return (
      <>
        <ProductionHeader />
        <ProductionErrorState
          title="Impossible de charger les filtres"
          description="Vérifiez que le service est disponible, puis réessayez."
          onRetry={() => metadataQuery.refetch()}
        />
      </>
    )
  }

  return <ProductionScreenReady metadata={metadataQuery.data} />
}

function ProductionScreenReady({
  metadata,
}: {
  metadata: ProductionFilterMetadata
}) {
  const {
    filters,
    setFilter,
    setCultureIndicator,
    resetFilters,
  } = useProductionFilters(metadata)

  // La campagne et l’indicateur sont propres au classement des cultures.
  const overviewFilters: ProductionFilters = {
    ...filters,
    campagnes: [],
    cultureIndicator: 'production',
  }

  const overviewQuery = useProductionOverviewQuery(overviewFilters)
  const cultureOverviewQuery = useProductionOverviewQuery(filters)

  const coverage =
    overviewQuery.data?.has_data === true
      ? overviewQuery.data.coverage
      : null

  const changeCultureCampaign = (campaign: string) => {
    setFilter('campagnes', campaign ? [campaign] : [])
  }

  const changeCultureIndicator = (
    indicator: CultureIndicator,
  ) => {
    setCultureIndicator(indicator)
  }

  return (
    <>
      <ProductionHeader coverage={coverage} />

      <div className="production-dashboard">
        <ProductionFilterBar
          metadata={metadata}
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
        />

        {overviewQuery.isPending && (
          <ProductionContentSkeleton />
        )}

        {overviewQuery.isError && (
          <ProductionErrorState
            title="Impossible de charger les données"
            description="Les données de production sont momentanément indisponibles."
            onRetry={() => overviewQuery.refetch()}
          />
        )}

        {overviewQuery.data && (
          <>
            {overviewQuery.isFetching &&
              !overviewQuery.isPending && (
                <p
                  className="production-refresh-status"
                  role="status"
                >
                  Mise à jour des données…
                </p>
              )}

            {!overviewQuery.data.has_data ? (
              <ProductionEmptyState
                title="Aucune donnée disponible"
                description="Cette combinaison de filtres ne contient aucune observation."
                onReset={resetFilters}
              />
            ) : (
              <>
                <EvolutionSection
                  points={overviewQuery.data.evolution}
                  units={metadata.units}
                />

                <ProductionDistributions
                  environmentItems={
                    overviewQuery.data.environment_distribution
                  }
                  irrigationItems={
                    overviewQuery.data.irrigation_distribution
                  }
                  environmentOptions={
                    metadata.types_environnement
                  }
                  irrigationOptions={
                    metadata.modes_irrigation
                  }
                  filters={filters}
                  units={metadata.units}
                />

                <CultureDistributionSection
                  items={
                    cultureOverviewQuery.data
                      ?.culture_distribution ?? []
                  }
                  campaignOptions={metadata.campagnes}
                  cultureOptions={metadata.cultures}
                  filters={filters}
                  units={metadata.units}
                  isPending={cultureOverviewQuery.isPending}
                  isFetching={cultureOverviewQuery.isFetching}
                  isError={cultureOverviewQuery.isError}
                  onCampaignChange={changeCultureCampaign}
                  onIndicatorChange={changeCultureIndicator}
                  onRetry={() =>
                    cultureOverviewQuery.refetch()
                  }
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

export function ProductionScreen() {
  return (
    <div className="production-screen">
      <ProductionScreenContent />
    </div>
  )
}