import {
  AlertCircle,
  Info,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react'

import {
  getPredictionErrorFeedback,
} from '../../api/predictionApi'
import {
  usePredictionMutation,
  usePredictionOptionsQuery,
} from '../../api/predictionQueries'
import {
  useProductionFilterMetadataQuery,
} from '../../api/productionQueries'
import { PredictionForm } from './components/PredictionForm'
import { PredictionResult } from './components/PredictionResult'

function PredictionInitialState() {
  return (
    <section className="prediction-initial-state">
      <Info
        aria-hidden="true"
        size={20}
      />
      <div>
        <h2>Prêt à estimer une production</h2>
        <p>
          Renseignez le scénario puis générez
          une prédiction. Aucun résultat n’est
          calculé avant la soumission.
        </p>
      </div>
    </section>
  )
}

function PredictionLoadingState() {
  return (
    <section
      className="prediction-loading-state"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderCircle
        className="prediction-spin"
        aria-hidden="true"
        size={20}
      />
      <div>
        <strong>
          Calcul de la prédiction
        </strong>
        <p>
          Le baseline M5 traite le scénario
          envoyé.
        </p>
      </div>
    </section>
  )
}

function PredictionReferenceLoadingState() {
  return (
    <section
      className="prediction-reference-state"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderCircle
        className="prediction-spin"
        aria-hidden="true"
        size={20}
      />
      <div>
        <strong>
          Chargement du formulaire
        </strong>
        <p>
          Récupération des provinces et des
          cultures disponibles.
        </p>
      </div>
    </section>
  )
}

interface PredictionErrorStateProps {
  title: string
  message: string
  onRetry?: () => void
}

function PredictionErrorState({
  title,
  message,
  onRetry,
}: PredictionErrorStateProps) {
  return (
    <section
      className="prediction-error-state"
      role="alert"
    >
      <AlertCircle
        aria-hidden="true"
        size={20}
      />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
        >
          <RefreshCw
            aria-hidden="true"
            size={15}
          />
          Réessayer
        </button>
      )}
    </section>
  )
}

export function PredictionsScreen() {
  const metadataQuery =
    useProductionFilterMetadataQuery()
  const optionsQuery =
    usePredictionOptionsQuery()
  const predictionMutation =
    usePredictionMutation()

  const referencesLoading =
    metadataQuery.isPending ||
    optionsQuery.isPending

  const referencesError =
    metadataQuery.isError ||
    optionsQuery.isError

  const feedback = predictionMutation.error
    ? getPredictionErrorFeedback(
        predictionMutation.error,
      )
    : null

  const resetPrediction = () => {
    if (!predictionMutation.isIdle) {
      predictionMutation.reset()
    }
  }

  const retryReferences = () => {
    void metadataQuery.refetch()
    void optionsQuery.refetch()
  }

  const modelBadge =
    predictionMutation.data
      ? `${predictionMutation.data.model.name} · v${predictionMutation.data.model.version}`
      : 'Baseline M5'

  return (
    <div className="predictions-screen">
      <header className="predictions-heading">
        <div>
          <p className="predictions-kicker">
            Aide à la décision
          </p>
          <h1>Prédictions agricoles</h1>
          <p>
            Estimez la production à partir de
            la province, de la culture et de
            la superficie prévue.
          </p>
        </div>

        <span className="prediction-model-badge">
          {modelBadge}
        </span>
      </header>

      {referencesLoading && (
        <PredictionReferenceLoadingState />
      )}

      {referencesError && (
        <PredictionErrorState
          title="Formulaire indisponible"
          message="Les options nécessaires au formulaire sont indisponibles."
          onRetry={retryReferences}
        />
      )}

      {!referencesError &&
        metadataQuery.data &&
        optionsQuery.data && (
          <>
            <PredictionForm
              provinces={
                metadataQuery.data.provinces
              }
              cultures={
                optionsQuery.data.cultures
              }
              isSubmitting={
                predictionMutation.isPending
              }
              onSubmit={(payload) =>
                predictionMutation.mutate(
                  payload,
                )
              }
              onScenarioChange={resetPrediction}
            />

            {predictionMutation.isPending && (
              <PredictionLoadingState />
            )}

            {predictionMutation.isError &&
              feedback && (
                <PredictionErrorState
                  title={
                    feedback.kind === 'validation'
                      ? 'Scénario à corriger'
                      : 'Impossible de calculer la prédiction'
                  }
                  message={feedback.message}
                />
              )}

            {predictionMutation.isSuccess &&
              predictionMutation.data && (
                <PredictionResult
                  result={
                    predictionMutation.data
                  }
                />
              )}

            {predictionMutation.isIdle && (
              <PredictionInitialState />
            )}
          </>
        )}
    </div>
  )
}
