from typing import Literal

from pydantic import BaseModel, ConfigDict

AgriculturalIndicator = Literal["production", "rendement"]
ClimateFactor = Literal[
    "precipitation",
    "et0",
    "deficit_climatique",
    "ratio_pluie_et0",
    "jours_secs",
    "sequence_seche_max",
    "temperature_moyenne",
    "temperature_max_absolue",
    "jours_tmax_ge_35",
    "stress_thermique_cumule",
    "humidite",
    "rayonnement",
    "vent_moyen_10m",
]


class AppliedClimateProductionFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")

    province: list[str]
    culture: list[str]
    type_environnement: list[str]
    mode_irrigation: list[str]
    agricultural_indicator: AgriculturalIndicator
    climate_factor: ClimateFactor


class ClimateProductionCoverageResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    rows_used: int
    rows_excluded: int
    missing_production: int
    agricultural_points_available: int
    agricultural_points_missing: int
    climate_points_available: int
    climate_points_missing: int


class AgriculturalMetricResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    value: AgriculturalIndicator
    label: str
    unit: str


class ClimateFactorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    value: ClimateFactor
    label: str
    unit: str
    group: str
    description: str


class ClimateProductionPointResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    campagne: str
    annee_debut: int
    agricultural_value: float | None
    climate_value: float | None
    rows_used: int
    missing_production: int


class ProvinceClimateSeriesResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    province: str
    province_label: str
    points: list[ClimateProductionPointResponse]


class ClimateProductionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    has_data: bool
    filters_applied: AppliedClimateProductionFilters
    coverage: ClimateProductionCoverageResponse
    agricultural_metric: AgriculturalMetricResponse
    selected_factor: ClimateFactorResponse
    available_factors: list[ClimateFactorResponse]
    series: list[ProvinceClimateSeriesResponse]
