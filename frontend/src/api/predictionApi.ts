import axios from 'axios'

import type {
  PredictionErrorFeedback,
  PredictionOptionsResponse,
  PredictionRequest,
  PredictionRequestField,
  PredictionResponse,
} from '../types/predictionTypes'
import { httpClient } from './httpClient'

export async function fetchPredictionOptions() {
  const response =
    await httpClient.get<PredictionOptionsResponse>('/predictions/options')

  return response.data
}

export async function createPrediction(payload: PredictionRequest) {
  const response = await httpClient.post<PredictionResponse>(
    '/predictions',
    payload,
  )

  return response.data
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPredictionRequestField(
  value: unknown,
): value is PredictionRequestField {
  return (
    value === 'province' ||
    value === 'culture' ||
    value === 'superficie_ha' ||
    value === 'campagne'
  )
}

function readStableValidationError(
  body: unknown,
): PredictionErrorFeedback | null {
  if (!isRecord(body) || !isRecord(body.detail)) {
    return null
  }

  const detail = body.detail

  if (typeof detail.message !== 'string') {
    return null
  }

  return {
    kind: 'validation',
    message: detail.message,
    field: isPredictionRequestField(detail.field)
      ? detail.field
      : undefined,
  }
}

export function getPredictionErrorFeedback(
  error: unknown,
): PredictionErrorFeedback {
  if (!axios.isAxiosError<unknown>(error)) {
    return {
      kind: 'service',
      message: "La prédiction n'a pas pu être calculée.",
    }
  }

  if (!error.response) {
    return {
      kind: 'service',
      message:
        'Impossible de joindre le service de prédiction. Vérifiez la connexion puis réessayez.',
    }
  }

  if (error.response.status === 422) {
    return (
      readStableValidationError(error.response.data) ?? {
        kind: 'validation',
        message: 'Vérifiez les valeurs saisies dans le formulaire.',
      }
    )
  }

  if (error.response.status === 503) {
    return {
      kind: 'service',
      message: 'Le modèle de prédiction est temporairement indisponible.',
    }
  }

  return {
    kind: 'service',
    message: "La prédiction n'a pas pu être calculée. Réessayez.",
  }
}
