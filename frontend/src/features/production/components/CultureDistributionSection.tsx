import type {
  CultureDistributionItem,
  CultureIndicator,
  FilterOption,
  ProductionFilters,
  ProductionUnits,
} from '../../../types/productionTypes'
import { formatSignedMetricValue } from '../utils/productionFormatters'
import {
  calculateSelectedYieldGap,
  CultureRanking,
} from './CultureRanking'
import {
  CultureRankingSkeleton,
  ProductionEmptyState,
  ProductionErrorState,
} from './ProductionStates'

interface CultureDistributionSectionProps {
  items: CultureDistributionItem[]
  campaignOptions: FilterOption[]
  cultureOptions: FilterOption[]
  filters: ProductionFilters
  units: ProductionUnits
  isPending: boolean
  isFetching: boolean
  isError: boolean
  onCampaignChange: (campaign: string) => void
  onIndicatorChange: (indicator: CultureIndicator) => void
  onRetry: () => void
}

interface IndicatorDefinition {
  value: CultureIndicator
  label: string
  unit: string
}

export function CultureDistributionSection({
  items,
  campaignOptions,
  cultureOptions,
  filters,
  units,
  isPending,
  isFetching,
  isError,
  onCampaignChange,
  onIndicatorChange,
  onRetry,
}: CultureDistributionSectionProps) {
  const indicators: IndicatorDefinition[] = [
    { value: 'production', label: 'Production', unit: units.production_t },
    { value: 'superficie', label: 'Superficie', unit: units.superficie_ha },
    {
      value: 'rendement',
      label: 'Rendement',
      unit: units.rendement_t_ha,
    },
  ]
  const activeIndicator =
    indicators.find(
      (indicator) => indicator.value === filters.cultureIndicator,
    ) ?? indicators[0]
  const selectedCampaign = filters.campagnes[0] ?? ''
  const selectedYieldGap =
    filters.cultureIndicator === 'rendement' && filters.cultures.length > 0
      ? calculateSelectedYieldGap(items)
      : null

  if (!activeIndicator) return null

  return (
    <section className="culture-section" aria-labelledby="culture-section-title">
      <div className="culture-section__header">
        <div>
          <h2 id="culture-section-title">Classement des cultures</h2>
          <p>
            {filters.cultures.length > 0
              ? 'Comparaison de la sélection avec les autres cultures.'
              : 'Cultures classées selon le périmètre filtré.'}
          </p>
        </div>

        <div className="culture-controls">
          <label className="culture-campaign-control">
            <span>Campagne</span>
            <select
              value={selectedCampaign}
              onChange={(event) => onCampaignChange(event.target.value)}
            >
              <option value="">Toutes les campagnes</option>
              {campaignOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div
            className="culture-indicator-control"
            role="group"
            aria-label="Indicateur du classement des cultures"
          >
            {indicators.map((indicator) => (
              <button
                key={indicator.value}
                type="button"
                aria-pressed={filters.cultureIndicator === indicator.value}
                onClick={() => onIndicatorChange(indicator.value)}
              >
                {indicator.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isFetching && !isPending && (
        <p className="culture-refresh-status" role="status">
          Mise à jour du classement…
        </p>
      )}

      {selectedYieldGap !== null && !isPending && !isError && (
        <p className="culture-yield-gap">
          Écart sélection / autres :{' '}
          <strong>
            {formatSignedMetricValue(
              selectedYieldGap,
              units.rendement_t_ha,
            )}
          </strong>
        </p>
      )}

      {isPending && <CultureRankingSkeleton />}

      {isError && (
        <ProductionErrorState
          compact
          title="Impossible de charger le classement"
          description="Le reste du dashboard reste disponible."
          onRetry={onRetry}
        />
      )}

      {!isPending && !isError && items.length === 0 && (
        <ProductionEmptyState
          compact
          title="Aucune culture disponible"
          description="Aucune culture ne correspond à cette campagne."
        />
      )}

      {!isPending && !isError && items.length > 0 && (
        <CultureRanking
          items={items}
          indicator={filters.cultureIndicator}
          cultureOptions={cultureOptions}
          selectedCultures={filters.cultures}
          unit={activeIndicator.unit}
          percentageUnit={units.part_pct}
        />
      )}
    </section>
  )
}
