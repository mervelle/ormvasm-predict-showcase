import { TriangleAlert } from 'lucide-react'

import { useClimateProductionSeriesQuery } from '../../api/climateProductionQueries'
import { useProductionFilterMetadataQuery } from '../../api/productionQueries'
import type { ClimateProductionCoverage } from '../../types/climateProductionTypes'
import type { ProductionFilters } from '../../types/productionTypes'
import { ProductionFilterBar } from '../production/components/ProductionFilterBar'
import {
  CoverageNotice,
  ProductionDashboardSkeleton,
  ProductionEmptyState,
  ProductionErrorState,
} from '../production/components/ProductionStates'
import type { ArrayFilterKey } from '../production/hooks/useProductionFilters'
import { ClimateProductionChart } from './components/ClimateProductionChart'
import { ClimateProductionControls } from './components/ClimateProductionControls'
import { ClimateProductionSkeleton } from './components/ClimateProductionStates'
import { useClimateProductionFilters } from './hooks/useClimateProductionFilters'
import { CLIMATE_CAUSALITY_NOTICE } from './climateProductionCopy'


function ClimateHeader({
  coverage,
}: {
  coverage?: ClimateProductionCoverage | null
}) {
  return (
    <header className="production-heading">
      <div>
        <p className="production-heading__kicker">Analyse agroclimatique</p>
        <h1>Climat × production</h1>
        <p>Souss-Massa · campagnes 2010/2011 à 2021/2022</p>
      </div>
      {coverage && <CoverageNotice coverage={coverage} />}
    </header>
  )
}

function ClimateProductionReady({
  metadata,
}: {
  metadata: NonNullable<
    ReturnType<typeof useProductionFilterMetadataQuery>['data']
  >
}) {
  const {
    filters,
    setGlobalFilter,
    setAgriculturalIndicator,
    setClimateFactor,
    resetFilters,
  } = useClimateProductionFilters(metadata)
  const seriesQuery = useClimateProductionSeriesQuery(filters)

  const productionFilters: ProductionFilters = {
    provinces: filters.provinces,
    cultures: filters.cultures,
    typesEnvironnement: filters.typesEnvironnement,
    modesIrrigation: filters.modesIrrigation,
    campagnes: [],
    cultureIndicator: 'production',
  }

  const handleGlobalFilterChange = (
    key: ArrayFilterKey,
    values: string[],
  ) => {
    if (key !== 'campagnes') setGlobalFilter(key, values)
  }

  const coverage = seriesQuery.data?.has_data
    ? seriesQuery.data.coverage
    : null

  return (
    <>
      <ClimateHeader coverage={coverage} />

      <div className="climate-dashboard">
        <ProductionFilterBar
          metadata={metadata}
          filters={productionFilters}
          onFilterChange={handleGlobalFilterChange}
          onReset={resetFilters}
        />

        <ClimateProductionControls
          agriculturalIndicator={filters.agriculturalIndicator}
          climateFactor={filters.climateFactor}
          factors={seriesQuery.data?.available_factors ?? []}
          disabled={seriesQuery.isPending}
          onAgriculturalIndicatorChange={setAgriculturalIndicator}
          onClimateFactorChange={setClimateFactor}
        />

        {seriesQuery.isPending && <ClimateProductionSkeleton />}

        {seriesQuery.isError && (
          <ProductionErrorState
            title="Impossible de charger la comparaison"
            description="Les séries agricoles et climatiques sont momentanément indisponibles."
            onRetry={() => seriesQuery.refetch()}
          />
        )}

        {seriesQuery.data && (
          <>
            {seriesQuery.isFetching && !seriesQuery.isPending && (
              <p className="production-refresh-status" role="status">
                Mise à jour de la comparaison…
              </p>
            )}

            {!seriesQuery.data.has_data ? (
              <ProductionEmptyState
                title="Aucune donnée disponible"
                description="Cette combinaison de filtres ne contient aucune observation agricole."
                onReset={resetFilters}
              />
            ) : (
              <>
                {(seriesQuery.data.coverage.climate_points_missing > 0 ||
                  seriesQuery.data.coverage.agricultural_points_missing > 0) && (
                  <div className="climate-coverage-warning" role="status">
                    <TriangleAlert aria-hidden="true" />
                    <p>
                      <strong>Couverture partielle.</strong>{' '}
                      {
                        seriesQuery.data.coverage
                          .agricultural_points_missing
                      }{' '}
                      point(s) agricole(s) et{' '}
                      {seriesQuery.data.coverage.climate_points_missing}{' '}
                      point(s) climatique(s) sont indisponibles.
                    </p>
                  </div>
                )}

                <section
                  className="climate-series-section"
                  aria-labelledby="climate-series-title"
                >
                  <div className="climate-series-section__heading">
                    <div>
                      <h2 id="climate-series-title">Évolution conjointe</h2>
                      <p>
                        {seriesQuery.data.agricultural_metric.label} et{' '}
                        {seriesQuery.data.selected_factor.label} par campagne.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`climate-chart-grid${
                      seriesQuery.data.series.length === 1
                        ? ' climate-chart-grid--single'
                        : ''
                    }`}
                  >
                    {seriesQuery.data.series.map((provinceSeries) => (
                      <ClimateProductionChart
                        key={provinceSeries.province}
                        series={provinceSeries}
                        agriculturalMetric={
                          seriesQuery.data.agricultural_metric
                        }
                        climateFactor={seriesQuery.data.selected_factor}
                        compact={seriesQuery.data.series.length > 1}
                      />
                    ))}
                  </div>
                </section>

                <aside className="climate-causality-note">
                  {CLIMATE_CAUSALITY_NOTICE}
                </aside>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

function ClimateProductionContent() {
  const metadataQuery = useProductionFilterMetadataQuery()

  if (metadataQuery.isPending) {
    return (
      <>
        <ClimateHeader />
        <ProductionDashboardSkeleton />
      </>
    )
  }

  if (metadataQuery.isError) {
    return (
      <>
        <ClimateHeader />
        <ProductionErrorState
          title="Impossible de charger les filtres"
          description="Vérifiez que le service est disponible, puis réessayez."
          onRetry={() => metadataQuery.refetch()}
        />
      </>
    )
  }

  return <ClimateProductionReady metadata={metadataQuery.data} />
}

export function ClimateProductionScreen() {
  return (
    <div className="production-screen climate-production-screen">
      <ClimateProductionContent />
    </div>
  )
}
