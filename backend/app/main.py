from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
import logging
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.ml.m5 import M5ArtifactError, load_m5_artifact
from app.repositories.climate_repository import ClimateRepository
from app.repositories.production_repository import ProductionRepository
from app.repositories.territory_repository import TerritoryGeoRepository
from app.repositories.raw_data_repository import (RawDataRepository,RawDataRepositoryError,)


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(
    application: FastAPI,
) -> AsyncGenerator[None, None]:
    """Charge et valide les données et artefacts au démarrage."""
    settings = get_settings()

    # Une erreur de validation des données principales interrompt le démarrage
    # afin d'éviter de servir des réponses construites sur des données invalides.
    application.state.production_repository = (
        ProductionRepository.from_csv(
            settings.dataset_path
        )
    )

    application.state.climate_repository = (
        ClimateRepository.from_csv(
            settings.climate_dataset_path
        )
    )

    application.state.territory_geo_repository = (
        TerritoryGeoRepository.from_files(
            settings.territory_geojson_path,
            settings.territory_geo_metadata_path,
        )
    )

    # Le modèle M5 est spécifique au Screen Prédictions.
    # Son indisponibilité ne doit pas empêcher les autres écrans
    # du dashboard de fonctionner.
    application.state.m5_artifact = None

    try:
        application.state.m5_artifact = load_m5_artifact(
            settings.m5_model_path
        )
    except M5ArtifactError:
        logger.exception(
            "Impossible de charger l'artefact M5 de prédiction."
        )


    application.state.raw_data_repository = None

    try:
        application.state.raw_data_repository = (
        RawDataRepository.from_excel(
            settings.raw_data_source_path,
            sheet_name=settings.raw_data_sheet_name,
            additions_path=settings.raw_data_additions_path,
        )
    )
    except RawDataRepositoryError:
        logger.exception(
           "Impossible de charger les données brutes ORMVA."
        )

    try:
        yield
    finally:
        del application.state.production_repository
        del application.state.climate_repository
        del application.state.territory_geo_repository
        del application.state.m5_artifact
        del application.state.raw_data_repository


def create_application() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "API REST du dashboard PIAD-Agri. "
            "Elle centralise la validation, les filtres "
            "et les calculs métier."
        ),
        openapi_tags=[
            {
                "name": "Système",
                "description": (
                    "Disponibilité et version du socle API."
                ),
            }
        ],
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Accept", "Content-Type"],
    )

    application.include_router(
        api_router,
        prefix=settings.api_v1_prefix,
    )

    return application


app = create_application()


@app.get("/", include_in_schema=False)
def root() -> dict[str, Any]:
    return {
        "name": get_settings().app_name,
        "docs": "/docs",
    }