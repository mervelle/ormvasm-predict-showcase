import type {
  AgriculturalIndicator,
  ClimateFactor,
  ClimateFactorMetadata,
} from '../../../types/climateProductionTypes'

interface ClimateProductionControlsProps {
  agriculturalIndicator: AgriculturalIndicator
  climateFactor: ClimateFactor
  factors: ClimateFactorMetadata[]
  disabled?: boolean
  onAgriculturalIndicatorChange: (value: AgriculturalIndicator) => void
  onClimateFactorChange: (value: ClimateFactor) => void
}

function groupFactors(factors: ClimateFactorMetadata[]) {
  return factors.reduce<Record<string, ClimateFactorMetadata[]>>(
    (groups, factor) => {
      const items = groups[factor.group] ?? []
      groups[factor.group] = [...items, factor]
      return groups
    },
    {},
  )
}

export function ClimateProductionControls({
  agriculturalIndicator,
  climateFactor,
  factors,
  disabled = false,
  onAgriculturalIndicatorChange,
  onClimateFactorChange,
}: ClimateProductionControlsProps) {
  const groupedFactors = groupFactors(factors)
  const selectedFactor = factors.find(
    (factor) => factor.value === climateFactor,
  )

  return (
    <section
      className="climate-controls"
      aria-labelledby="climate-controls-title"
    >
      <div className="climate-controls__heading">
        <div>
          <h2 id="climate-controls-title">Indicateurs comparés</h2>
          <p>Une métrique agricole et un facteur climatique.</p>
        </div>
      </div>

      <div className="climate-controls__fields">
        <fieldset className="climate-indicator-field">
          <legend>Indicateur agricole</legend>
          <div
            className="climate-indicator-toggle"
            role="group"
            aria-label="Indicateur agricole"
          >
            {(['production', 'rendement'] as const).map((indicator) => (
              <button
                key={indicator}
                type="button"
                aria-pressed={agriculturalIndicator === indicator}
                disabled={disabled}
                onClick={() => onAgriculturalIndicatorChange(indicator)}
              >
                {indicator === 'production' ? 'Production' : 'Rendement'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="climate-factor-field">
          <label htmlFor="climate-factor">Facteur climatique</label>
          <select
            id="climate-factor"
            value={climateFactor}
            disabled={disabled || factors.length === 0}
            onChange={(event) =>
              onClimateFactorChange(event.target.value as ClimateFactor)
            }
          >
            {factors.length === 0 && (
              <option value={climateFactor}>Facteurs indisponibles</option>
            )}
            {Object.entries(groupedFactors).map(([group, options]) => (
              <optgroup key={group} label={group}>
                {options.map((factor) => (
                  <option key={factor.value} value={factor.value}>
                    {factor.label} · {factor.unit}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {selectedFactor && (
        <p className="climate-factor-description">
          <strong>{selectedFactor.label}:</strong>{' '}
          {selectedFactor.description}
        </p>
      )}
    </section>
  )
}
