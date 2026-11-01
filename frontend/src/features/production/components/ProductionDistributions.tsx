import type {
  CategoryDistributionItem,
  FilterOption,
  ProductionFilters,
  ProductionUnits,
} from '../../../types/productionTypes'
import { CategoryDistributionCard } from './CategoryDistributionCard'

interface ProductionDistributionsProps {
  environmentItems: CategoryDistributionItem[]
  irrigationItems: CategoryDistributionItem[]
  environmentOptions: FilterOption[]
  irrigationOptions: FilterOption[]
  filters: ProductionFilters
  units: ProductionUnits
}

export function ProductionDistributions({
  environmentItems,
  irrigationItems,
  environmentOptions,
  irrigationOptions,
  filters,
  units,
}: ProductionDistributionsProps) {
  // Cette logique concerne seulement la visibilité de l’interface. Le filtrage
  // et les agrégations restent entièrement dans la couche API et le backend.
  const showEnvironment = filters.typesEnvironnement.length === 0
  const showIrrigation = filters.modesIrrigation.length === 0

  if (!showEnvironment && !showIrrigation) {
    return null
  }

  return (
    <section
      className="distribution-section"
      aria-labelledby="distribution-title"
    >
      <div className="distribution-section__header">
        <h2 id="distribution-title">Répartition des superficies</h2>
        <p>Parts calculées par l’API sur le périmètre filtré.</p>
      </div>

      <div
        className={`distribution-grid${
          showEnvironment && showIrrigation
            ? ''
            : ' distribution-grid--single'
        }`}
      >
        {showEnvironment && (
          <CategoryDistributionCard
            kind="environment"
            title="Type d’environnement"
            items={environmentItems}
            options={environmentOptions}
            areaUnit={units.superficie_ha}
            percentageUnit={units.part_pct}
          />
        )}

        {showIrrigation && (
          <CategoryDistributionCard
            kind="irrigation"
            title="Mode d’irrigation"
            items={irrigationItems}
            options={irrigationOptions}
            areaUnit={units.superficie_ha}
            percentageUnit={units.part_pct}
          />
        )}
      </div>
    </section>
  )
}
