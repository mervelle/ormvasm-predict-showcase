from typing import Annotated, TypeAlias

from fastapi import Depends, HTTPException, Request, status
from app.ml.m5 import M5Artifact


from app.repositories.climate_repository import ClimateRepository
from app.repositories.production_repository import ProductionRepository
from app.repositories.territory_repository import TerritoryGeoRepository
from app.repositories.raw_data_repository import RawDataRepository




def get_production_repository(request: Request) -> ProductionRepository:
    """Récupère le repository de production chargé au démarrage."""
    repository = getattr(request.app.state, "production_repository", None)
    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Données de production indisponibles.",
        )
    return repository


def get_climate_repository(request: Request) -> ClimateRepository:
    """Récupère le repository climatique chargé au démarrage."""
    repository = getattr(request.app.state, "climate_repository", None)
    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Données climatiques indisponibles.",
        )
    return repository

def get_territory_geo_repository(request: Request) -> TerritoryGeoRepository:
    repository = getattr(request.app.state, "territory_geo_repository", None)
    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Données géographiques indisponibles.",
        )
    return repository

def get_m5_artifact(request: Request) -> M5Artifact:
    artifact = getattr(request.app.state, "m5_artifact", None)

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "prediction_model_unavailable",
                "message": "Modèle de prédiction indisponible.",
            },
        )

    return artifact

def get_raw_data_repository(
    request: Request,
) -> RawDataRepository:
    repository = getattr(
        request.app.state,
        "raw_data_repository",
        None,
    )

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "raw_data_unavailable",
                "message": "Données brutes indisponibles.",
            },
        )

    return repository






ProductionRepositoryDependency: TypeAlias = Annotated[
    ProductionRepository,
    Depends(get_production_repository),
]

ClimateRepositoryDependency: TypeAlias = Annotated[
    ClimateRepository,
    Depends(get_climate_repository),
]

TerritoryGeoRepositoryDependency: TypeAlias = Annotated[
    TerritoryGeoRepository,
    Depends(get_territory_geo_repository),
]

M5ArtifactDependency: TypeAlias = Annotated[
    M5Artifact,
    Depends(get_m5_artifact),
]

RawDataRepositoryDependency: TypeAlias = Annotated[
    RawDataRepository,
    Depends(get_raw_data_repository),
]
