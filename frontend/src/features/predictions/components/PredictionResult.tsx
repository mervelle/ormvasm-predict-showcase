import {
  Info,
  MapPinned,
  Ruler,
  Sprout,
  TrendingUp,
} from 'lucide-react'

import type {
  PredictionHistoryReference,
  PredictionResponse,
} from '../../../types/predictionTypes'
import { formatMetricValue } from '../../production/utils/productionFormatters'
import { PredictionHistoryChart } from './PredictionHistoryChart'

interface PredictionResultProps {
  result: PredictionResponse
}

function formatReferenceValue(
  reference: PredictionHistoryReference | null,
) {
  if (!reference) {
    return {
      value: 'Donnée indisponible',
      campaign: null,
    }
  }

  return {
    value: formatMetricValue(
      reference.production_t,
      't',
      0,
    ),
    campaign: reference.campagne,
  }
}

function HistoryReference({
  label,
  reference,
}: {
  label: string
  reference: PredictionHistoryReference | null
}) {
  const formatted =
    formatReferenceValue(reference)

  return (
    <div className="prediction-stat-row">
      <span>{label}</span>
      <div>
        <strong>{formatted.value}</strong>
        {formatted.campaign && (
          <small>{formatted.campaign}</small>
        )}
      </div>
    </div>
  )
}

export function PredictionResult({
  result,
}: PredictionResultProps) {
  const meanProduction =
    result.history.mean_production_t === null
      ? 'Donnée indisponible'
      : formatMetricValue(
          result.history.mean_production_t,
          't',
          0,
        )

  return (
    <div
      className="prediction-result"
      aria-live="polite"
    >
      <div className="prediction-result-grid">
        <section
          className="prediction-primary-card"
          aria-labelledby="prediction-result-title"
        >
          <div className="prediction-primary-main">
            <div
              className="prediction-result-label"
              id="prediction-result-title"
            >
              <TrendingUp
                aria-hidden="true"
                size={18}
              />
              Production estimée
            </div>

            <strong className="prediction-result-value">
              {formatMetricValue(
                result.prediction.production_t,
                result.model.target_unit,
                0,
              )}
            </strong>

            <p className="prediction-result-summary">
              {result.scenario.culture_label}
              {' · '}
              {result.scenario.province_label}
              {' · '}
              {formatMetricValue(
                result.scenario.superficie_ha,
                'ha',
                2,
              )}
              {' · campagne '}
              {result.scenario.campagne}
            </p>

            <span className="prediction-estimate-note">
              <Info
                aria-hidden="true"
                size={16}
              />
              Estimation ponctuelle du modèle,
              distincte d’une observation.
            </span>
          </div>

          <aside className="prediction-yield-panel">
            <span>Rendement implicite</span>
            <strong>
              {formatMetricValue(
                result.prediction
                  .implicit_yield_t_ha,
                't/ha',
                1,
              )}
            </strong>
            <p>
              Indicateur dérivé retourné par
              l’API. Il n’est pas une seconde
              cible prédite.
            </p>
          </aside>
        </section>

        <aside
          className="prediction-context-card"
          aria-labelledby="prediction-context-title"
        >
          <h2 id="prediction-context-title">
            Contexte du scénario
          </h2>
          <p>
            Valeurs utilisées pour cette
            estimation.
          </p>

          <dl className="prediction-context-list">
            <div>
              <dt>Province</dt>
              <dd>
                {result.scenario.province_label}
              </dd>
            </div>
            <div>
              <dt>Culture</dt>
              <dd>
                {result.scenario.culture_label}
              </dd>
            </div>
            <div>
              <dt>Superficie</dt>
              <dd>
                {formatMetricValue(
                  result.scenario.superficie_ha,
                  'ha',
                  2,
                )}
              </dd>
            </div>
            <div>
              <dt>Campagne cible</dt>
              <dd>
                {result.scenario.campagne}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <PredictionHistoryChart result={result} />

      <div className="prediction-lower-grid">
        <section
          className="prediction-history-card"
          aria-labelledby="prediction-history-title"
        >
          <h2 id="prediction-history-title">
            Repères historiques
          </h2>
          <p>
            Même combinaison :{' '}
            {result.scenario.province_label}
            {' + '}
            {result.scenario.culture_label}.
          </p>

          {result.history.has_data ? (
            <div className="prediction-stat-list">
              <HistoryReference
                label="Dernière observation"
                reference={result.history.latest}
              />

              <div className="prediction-stat-row">
                <span>Moyenne historique</span>
                <div>
                  <strong>
                    {meanProduction}
                  </strong>
                </div>
              </div>

              <HistoryReference
                label="Minimum historique"
                reference={result.history.minimum}
              />

              <HistoryReference
                label="Maximum historique"
                reference={result.history.maximum}
              />
            </div>
          ) : (
            <div className="prediction-inline-empty">
              Donnée indisponible
            </div>
          )}
        </section>

        <section
          className="prediction-factors-card"
          aria-labelledby="prediction-factors-title"
        >
          <h2 id="prediction-factors-title">
            Variables utilisées
          </h2>
          <p>
            Entrées métier prises en compte par
            le baseline M5.
          </p>

          <div className="prediction-factor-list">
            <div className="prediction-factor">
              <span className="prediction-factor-icon">
                <MapPinned
                  aria-hidden="true"
                  size={17}
                />
              </span>
              <span>
                <strong>Province</strong>
                <small>
                  Contexte territorial
                </small>
              </span>
              <b>
                {result.scenario.province_label}
              </b>
            </div>

            <div className="prediction-factor">
              <span className="prediction-factor-icon">
                <Sprout
                  aria-hidden="true"
                  size={17}
                />
              </span>
              <span>
                <strong>Culture</strong>
                <small>
                  Catégorie culturale
                </small>
              </span>
              <b>
                {result.scenario.culture_label}
              </b>
            </div>

            <div className="prediction-factor">
              <span className="prediction-factor-icon">
                <Ruler
                  aria-hidden="true"
                  size={17}
                />
              </span>
              <span>
                <strong>Superficie</strong>
                <small>
                  Variable quantitative
                </small>
              </span>
              <b>
                {formatMetricValue(
                  result.scenario.superficie_ha,
                  'ha',
                  2,
                )}
              </b>
            </div>
          </div>
        </section>
      </div>

      <aside
        className="prediction-model-info"
        aria-label="Limites et informations du modèle"
      >
        <Info
          aria-hidden="true"
          size={20}
        />

        <div className="prediction-model-copy">
          <strong>
            À propos de cette estimation
          </strong>
          <p>
            Elle repose sur les relations
            historiques entre superficie,
            culture et province. Elle n’intègre
            pas les conditions climatiques
            futures, ne constitue pas une
            recommandation agronomique et ne
            possède pas d’intervalle
            d’incertitude dans cette version.
          </p>

          {result.model.limitations.length >
            0 && (
            <ul>
              {result.model.limitations.map(
                (limitation) => (
                  <li key={limitation}>
                    {limitation}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>

        <div className="prediction-model-meta">
          <span>{result.model.name}</span>
          <span>
            Entraînement{' '}
            {result.model.training_start_campaign}
            {'–'}
            {result.model.training_end_campaign}
          </span>
          <span>
            Version {result.model.version}
          </span>
        </div>
      </aside>
    </div>
  )
}
