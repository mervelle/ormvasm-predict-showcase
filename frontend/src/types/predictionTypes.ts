export interface PredictionRequest {
  province: string
  culture: string
  superficie_ha: number
  campagne: string
}

export interface PredictionScenario {
  province: string
  province_label: string
  culture: string
  culture_label: string
  famille: string
  culture_analyse: string
  superficie_ha: number
  campagne: string
}

export interface PredictionEstimate {
  production_t: number
  implicit_yield_t_ha: number
  estimate_type: 'point'
}

export interface PredictionHistoryPoint {
  campagne: string
  annee_debut: number
  production_t: number | null
  rows_used: number
  missing_production: number
}

export interface PredictionHistoryReference {
  campagne: string
  annee_debut: number
  production_t: number
}

export interface PredictionHistory {
  has_data: boolean
  series: PredictionHistoryPoint[]
  latest: PredictionHistoryReference | null
  mean_production_t: number | null
  minimum: PredictionHistoryReference | null
  maximum: PredictionHistoryReference | null
}

export interface PredictionModel {
  name: string
  technical_name: string
  version: string
  training_start_campaign: string
  training_end_campaign: string
  target: string
  target_unit: string
  features: string[]
  uses_climate: boolean
  has_prediction_interval: boolean
  has_shap_explanation: boolean
  limitations: string[]
}

export interface PredictionResponse {
  has_prediction: boolean
  scenario: PredictionScenario
  prediction: PredictionEstimate
  history: PredictionHistory
  model: PredictionModel
}

export interface PredictionCultureOption {
  value: string
  label: string
  famille: string
  famille_label: string
}

export interface PredictionOptionsResponse {
  cultures: PredictionCultureOption[]
}

export type PredictionRequestField = keyof PredictionRequest

export interface PredictionErrorFeedback {
  kind: 'validation' | 'service'
  message: string
  field?: PredictionRequestField
}
