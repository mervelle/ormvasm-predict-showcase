from typing import Literal

from pydantic import BaseModel, ConfigDict

CultureIndicator = Literal["production", "superficie", "rendement"]


class AppliedFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")

    province: list[str]
    culture: list[str]
    type_environnement: list[str]
    mode_irrigation: list[str]
    campagne: str | None
    culture_indicateur: CultureIndicator


class CoverageResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    rows_used: int
    rows_excluded: int
    missing_production: int


class EvolutionPointResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    campagne: str
    annee_debut: int
    production_t: float | None
    superficie_ha: float | None
    rendement_t_ha: float | None
    rows_used: int
    missing_production: int


class CategoryDistributionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    value: str
    superficie_ha: float
    part_pct: float


class CultureDistributionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    culture: str
    value: float | None
    part_pct: float | None
    rows_used: int
    missing_production: int


class ProductionOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    has_data: bool
    filters_applied: AppliedFilters
    coverage: CoverageResponse
    evolution: list[EvolutionPointResponse]
    environment_distribution: list[CategoryDistributionResponse]
    irrigation_distribution: list[CategoryDistributionResponse]
    culture_distribution: list[CultureDistributionResponse]
