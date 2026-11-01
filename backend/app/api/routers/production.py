from typing import Annotated, TypeAlias

from fastapi import APIRouter, HTTPException, Query, status

from app.api.dependencies import ProductionRepositoryDependency
from app.schemas.production import (
    AppliedFilters,
    CultureIndicator,
    ProductionOverviewResponse,
)
from app.services.production_filters import ProductionFilters
from app.services.production_metadata import InvalidFilterValueError
from app.services.production_overview import build_production_overview

router = APIRouter(prefix="/production", tags=["Production"])

MultiValueQuery: TypeAlias = Annotated[list[str] | None, Query()]
CampaignQuery: TypeAlias = Annotated[str | None, Query()]
IndicatorQuery: TypeAlias = Annotated[CultureIndicator, Query()]


@router.get("/overview", response_model=ProductionOverviewResponse)
def get_production_overview(
    repository: ProductionRepositoryDependency,
    province: MultiValueQuery = None,
    culture: MultiValueQuery = None,
    type_environnement: MultiValueQuery = None,
    mode_irrigation: MultiValueQuery = None,
    campagne: CampaignQuery = None,
    culture_indicateur: IndicatorQuery = "production",
) -> ProductionOverviewResponse:
    """Retourne les données agrégées nécessaires au Screen 1."""
    filters = ProductionFilters(
        provinces=tuple(province or ()),
        cultures=tuple(culture or ()),
        types_environnement=tuple(type_environnement or ()),
        modes_irrigation=tuple(mode_irrigation or ()),
    )

    try:
        overview = build_production_overview(
            repository.get_all(),
            filters,
            culture_campaign=campagne,
            culture_indicator=culture_indicateur,
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

    return ProductionOverviewResponse(
        has_data=overview.has_data,
        filters_applied=AppliedFilters(
            province=list(filters.provinces),
            culture=list(filters.cultures),
            type_environnement=list(filters.types_environnement),
            mode_irrigation=list(filters.modes_irrigation),
            campagne=campagne,
            culture_indicateur=culture_indicateur,
        ),
        coverage=overview.coverage,
        evolution=overview.evolution,
        environment_distribution=overview.environment_distribution,
        irrigation_distribution=overview.irrigation_distribution,
        culture_distribution=overview.culture_distribution,
    )
