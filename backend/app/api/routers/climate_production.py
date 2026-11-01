from typing import Annotated, TypeAlias

from fastapi import APIRouter, HTTPException, Query, status

from app.api.dependencies import (
    ClimateRepositoryDependency,
    ProductionRepositoryDependency,
)
from app.schemas.climate_production import (
    AgriculturalIndicator,
    AppliedClimateProductionFilters,
    ClimateFactor,
    ClimateProductionResponse,
)
from app.services.climate_production import build_climate_production_series
from app.services.production_filters import ProductionFilters
from app.services.production_metadata import InvalidFilterValueError

router = APIRouter(prefix="/climate-production", tags=["Climat × production"])

MultiValueQuery: TypeAlias = Annotated[list[str] | None, Query()]
AgriculturalIndicatorQuery: TypeAlias = Annotated[
    AgriculturalIndicator,
    Query(),
]
ClimateFactorQuery: TypeAlias = Annotated[ClimateFactor, Query()]


@router.get("/series", response_model=ClimateProductionResponse)
def get_climate_production_series(
    production_repository: ProductionRepositoryDependency,
    climate_repository: ClimateRepositoryDependency,
    province: MultiValueQuery = None,
    culture: MultiValueQuery = None,
    type_environnement: MultiValueQuery = None,
    mode_irrigation: MultiValueQuery = None,
    agricultural_indicator: AgriculturalIndicatorQuery = "production",
    climate_factor: ClimateFactorQuery = "precipitation",
) -> ClimateProductionResponse:
    """Retourne une série agricole et climatique séparée par province."""
    filters = ProductionFilters(
        provinces=tuple(province or ()),
        cultures=tuple(culture or ()),
        types_environnement=tuple(type_environnement or ()),
        modes_irrigation=tuple(mode_irrigation or ()),
    )

    try:
        result = build_climate_production_series(
            production_repository.get_all(),
            climate_repository.data,
            filters,
            agricultural_indicator=agricultural_indicator,
            climate_factor=climate_factor,
        )
    except InvalidFilterValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "invalid_filter_value",
                "field": error.field,
                "values": error.values,
            },
        ) from error

    return ClimateProductionResponse(
        has_data=result.has_data,
        filters_applied=AppliedClimateProductionFilters(
            province=list(filters.provinces),
            culture=list(filters.cultures),
            type_environnement=list(filters.types_environnement),
            mode_irrigation=list(filters.modes_irrigation),
            agricultural_indicator=agricultural_indicator,
            climate_factor=climate_factor,
        ),
        coverage=result.coverage,
        agricultural_metric=result.agricultural_metric,
        selected_factor=result.selected_factor,
        available_factors=result.available_factors,
        series=result.series,
    )
