import { LoaderCircle, Sparkles } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import type { FilterOption } from '../../../types/productionTypes'
import type {
  PredictionCultureOption,
  PredictionRequest,
} from '../../../types/predictionTypes'

interface PredictionFormProps {
  provinces: FilterOption[]
  cultures: PredictionCultureOption[]
  isSubmitting: boolean
  onSubmit: (payload: PredictionRequest) => void
  onScenarioChange: () => void
}

interface PredictionFormValues {
  province: string
  culture: string
  superficie: string
  campagne: string
}

type PredictionFormField = keyof PredictionFormValues

type PredictionFormErrors = Partial<
  Record<PredictionFormField, string>
>

const INITIAL_VALUES: PredictionFormValues = {
  province: '',
  culture: '',
  superficie: '',
  campagne: '',
}

function groupCultures(cultures: PredictionCultureOption[]) {
  const groups = new Map<
    string,
    {
      label: string
      options: PredictionCultureOption[]
    }
  >()

  cultures.forEach((culture) => {
    const current = groups.get(culture.famille)

    if (current) {
      current.options.push(culture)
      return
    }

    groups.set(culture.famille, {
      label: culture.famille_label,
      options: [culture],
    })
  })

  return [...groups.entries()]
}

function validateCampaign(value: string) {
  const match = /^(\d{4})\/(\d{4})$/.exec(value.trim())

  if (!match) {
    return false
  }

  return Number(match[2]) === Number(match[1]) + 1
}

function validateForm(values: PredictionFormValues) {
  const errors: PredictionFormErrors = {}
  const area = Number(values.superficie)

  if (!values.province) {
    errors.province = 'Sélectionnez une province.'
  }

  if (!values.culture) {
    errors.culture = 'Sélectionnez une culture.'
  }

  if (
    values.superficie.trim() === '' ||
    !Number.isFinite(area) ||
    area <= 0
  ) {
    errors.superficie =
      'Saisissez une superficie strictement positive.'
  }

  if (!validateCampaign(values.campagne)) {
    errors.campagne =
      'Utilisez le format AAAA/AAAA avec deux années consécutives.'
  }

  return {
    errors,
    area,
  }
}

export function PredictionForm({
  provinces,
  cultures,
  isSubmitting,
  onSubmit,
  onScenarioChange,
}: PredictionFormProps) {
  const [values, setValues] =
    useState<PredictionFormValues>(INITIAL_VALUES)
  const [errors, setErrors] =
    useState<PredictionFormErrors>({})

  const cultureGroups = useMemo(
    () => groupCultures(cultures),
    [cultures],
  )

  const updateField = (
    field: PredictionFormField,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })

    onScenarioChange()
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const validation = validateForm(values)
    setErrors(validation.errors)

    if (Object.keys(validation.errors).length > 0) {
      return
    }

    onSubmit({
      province: values.province,
      culture: values.culture,
      superficie_ha: validation.area,
      campagne: values.campagne.trim(),
    })
  }

  return (
    <section
      className="prediction-form-card"
      aria-labelledby="prediction-form-title"
    >
      <div className="prediction-section-heading">
        <div>
          <h2 id="prediction-form-title">
            Paramètres de prédiction
          </h2>
          <p>
            Province, culture et superficie alimentent M5. La
            campagne situe uniquement le scénario.
          </p>
        </div>

        <span>Tous les champs sont requis</span>
      </div>

      <form noValidate onSubmit={handleSubmit}>
        <div className="prediction-form-grid">

          {/* Province */}
          <div className="prediction-field">
            <label htmlFor="prediction-province">
              Province
            </label>

            <select
              id="prediction-province"
              value={values.province}
              aria-invalid={Boolean(errors.province)}
              aria-describedby={
                errors.province
                  ? 'prediction-province-error'
                  : undefined
              }
              disabled={isSubmitting}
              onChange={(event) =>
                updateField('province', event.target.value)
              }
            >
              <option value="">Sélectionner</option>

              {provinces.map((province) => (
                <option
                  key={province.value}
                  value={province.value}
                >
                  {province.label}
                </option>
              ))}
            </select>

            {errors.province && (
              <small
                id="prediction-province-error"
                className="prediction-field-error"
              >
                {errors.province}
              </small>
            )}
          </div>

          {/* Culture */}
          <div className="prediction-field">
            <label htmlFor="prediction-culture">
              Culture
            </label>

            <select
              id="prediction-culture"
              value={values.culture}
              aria-invalid={Boolean(errors.culture)}
              aria-describedby={
                errors.culture
                  ? 'prediction-culture-error'
                  : undefined
              }
              disabled={isSubmitting}
              onChange={(event) =>
                updateField('culture', event.target.value)
              }
            >
              <option value="">Sélectionner</option>

              {cultureGroups.map(([family, group]) => (
                <optgroup
                  key={family}
                  label={group.label}
                >
                  {group.options.map((culture) => (
                    <option
                      key={culture.value}
                      value={culture.value}
                    >
                      {culture.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {errors.culture && (
              <small
                id="prediction-culture-error"
                className="prediction-field-error"
              >
                {errors.culture}
              </small>
            )}
          </div>

          {/* Superficie */}
          <div className="prediction-field">
            <label htmlFor="prediction-area">
              Superficie prévue
            </label>

            <div className="prediction-input-with-unit">
              <input
                id="prediction-area"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={values.superficie}
                aria-invalid={Boolean(errors.superficie)}
                aria-describedby={
                  errors.superficie
                    ? 'prediction-area-error'
                    : 'prediction-area-help'
                }
                disabled={isSubmitting}
                onChange={(event) =>
                  updateField(
                    'superficie',
                    event.target.value,
                  )
                }
              />

              <span aria-hidden="true">ha</span>
            </div>

            {errors.superficie ? (
              <small
                id="prediction-area-error"
                className="prediction-field-error"
              >
                {errors.superficie}
              </small>
            ) : (
              <small id="prediction-area-help">
                Valeur strictement positive
              </small>
            )}
          </div>

          {/* Campagne */}
          <div className="prediction-field">
            <label htmlFor="prediction-campaign">
              Campagne cible
            </label>

            <input
              id="prediction-campaign"
              type="text"
              inputMode="numeric"
              placeholder="2022/2023"
              value={values.campagne}
              aria-invalid={Boolean(errors.campagne)}
              aria-describedby={
                errors.campagne
                  ? 'prediction-campaign-error'
                  : 'prediction-campaign-help'
              }
              disabled={isSubmitting}
              onChange={(event) =>
                updateField(
                  'campagne',
                  event.target.value,
                )
              }
            />

            {errors.campagne ? (
              <small
                id="prediction-campaign-error"
                className="prediction-field-error"
              >
                {errors.campagne}
              </small>
            ) : (
              <small id="prediction-campaign-help">
                Format AAAA/AAAA
              </small>
            )}
          </div>

          <button
            className="prediction-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="prediction-spin"
                  aria-hidden="true"
                  size={17}
                />
                Calcul en cours…
              </>
            ) : (
              <>
                <Sparkles
                  aria-hidden="true"
                  size={17}
                />
                Générer la prédiction
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}