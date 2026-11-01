from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        str_strip_whitespace=True,
    )


class PredictionRequest(StrictModel):
    province: str = Field(min_length=2, max_length=80)
    culture: str = Field(
        min_length=3,
        max_length=160,
        pattern=r"^[^:]+::[^:]+$",
        description="Clé famille::culture figée par le contrat M5.",
    )
    superficie_ha: float = Field(gt=0, allow_inf_nan=False)
    campagne: str = Field(
        pattern=r"^\d{4}/\d{4}$",
        description="Campagne cible contextuelle au format AAAA/AAAA+1.",
    )

    @field_validator("province", "culture")
    @classmethod
    def normalize_key_fields(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("campagne")
    @classmethod
    def validate_campaign_sequence(cls, value: str) -> str:
        start_text, end_text = value.split("/", maxsplit=1)
        if int(end_text) != int(start_text) + 1:
            raise ValueError("La campagne doit respecter le format AAAA/AAAA+1.")
        return value


class PredictionScenarioResponse(StrictModel):
    province: str
    province_label: str
    culture: str
    culture_label: str
    famille: str
    culture_analyse: str
    superficie_ha: float
    campagne: str


class PredictionValueResponse(StrictModel):
    production_t: float
    implicit_yield_t_ha: float
    estimate_type: Literal["point"]


class PredictionHistoryPointResponse(StrictModel):
    campagne: str
    annee_debut: int
    production_t: float | None
    rows_used: int
    missing_production: int


class PredictionHistoryReferenceResponse(StrictModel):
    campagne: str
    annee_debut: int
    production_t: float


class PredictionHistoryResponse(StrictModel):
    has_data: bool
    series: list[PredictionHistoryPointResponse]
    latest: PredictionHistoryReferenceResponse | None
    mean_production_t: float | None
    minimum: PredictionHistoryReferenceResponse | None
    maximum: PredictionHistoryReferenceResponse | None


class PredictionModelResponse(StrictModel):
    name: str
    technical_name: str
    version: str
    training_start_campaign: str
    training_end_campaign: str
    target: str
    target_unit: str
    features: list[str]
    uses_climate: bool
    has_prediction_interval: bool
    has_shap_explanation: bool
    limitations: list[str]


class PredictionResponse(StrictModel):
    has_prediction: bool
    scenario: PredictionScenarioResponse
    prediction: PredictionValueResponse
    history: PredictionHistoryResponse
    model: PredictionModelResponse

class PredictionCultureOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str
    label: str
    famille: str
    famille_label: str


class PredictionOptionsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cultures: list[PredictionCultureOption]
