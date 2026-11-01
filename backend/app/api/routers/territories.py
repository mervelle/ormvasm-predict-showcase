from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.api.dependencies import (
    ClimateRepositoryDependency,
    ProductionRepositoryDependency,
    TerritoryGeoRepositoryDependency,
)
from app.schemas.territory import (
    TerritoriesResponse,
    TerritoryDetailResponse,
)
from app.services.territories import (
    build_territories_overview,
    build_territory_detail,
)
from app.services.territory_statistics import UnknownTerritoryError

router = APIRouter(prefix="/territories", tags=["Territoire"])

TerritorySlugPath = Annotated[
    str,
    Path(min_length=2, max_length=80),
]


@router.get("", response_model=TerritoriesResponse)
def get_territories(
    production_repository: ProductionRepositoryDependency,
    climate_repository: ClimateRepositoryDependency,
    geo_repository: TerritoryGeoRepositoryDependency,
) -> TerritoriesResponse:
    """Retourne la région, les quatre territoires, la carte et l'attribution."""
    result = build_territories_overview(
        production_repository.get_all(),
        climate_repository.data,
        geo_repository,
    )
    return TerritoriesResponse.model_validate(result)


@router.get("/{province_slug}", response_model=TerritoryDetailResponse)
def get_territory(
    province_slug: TerritorySlugPath,
    production_repository: ProductionRepositoryDependency,
    climate_repository: ClimateRepositoryDependency,
) -> TerritoryDetailResponse:
    """Retourne la fiche calculée d'un territoire couvert."""
    try:
        result = build_territory_detail(
            production_repository.get_all(),
            climate_repository.data,
            province_slug=province_slug,
        )
    except UnknownTerritoryError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "unknown_territory",
                "message": "Territoire non couvert par le projet.",
            },
        ) from error

    return TerritoryDetailResponse.model_validate(result)
