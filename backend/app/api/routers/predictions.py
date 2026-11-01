from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import M5ArtifactDependency, ProductionRepositoryDependency
from app.ml.m5 import M5ArtifactError
from app.schemas.prediction import (
    PredictionOptionsResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.predictions import (
    PredictionInputError,
    build_prediction,
    build_prediction_options,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["Prédictions"])


@router.get(
    "/options",
    response_model=PredictionOptionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Lister les cultures disponibles pour M5",
    description=(
        "Retourne les clés cultures composites réellement supportées par "
        "l'artefact M5 chargé. Ces valeurs servent au formulaire de prédiction."
    ),
)
def get_prediction_options(
    artifact: M5ArtifactDependency,
) -> PredictionOptionsResponse:
    result = build_prediction_options(artifact)
    return PredictionOptionsResponse.model_validate(result)


@router.post(
    "",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Générer une estimation de production avec le baseline M5",
    description=(
        "Produit une estimation ponctuelle à partir de la province, de la culture "
        "et de la superficie. La campagne cible est contextuelle et n'est pas "
        "injectée dans le modèle. Le baseline M5 n'utilise aucune variable climatique."
    ),
    responses={
        422: {"description": "Scénario invalide ou catégorie non supportée."},
        503: {"description": "Artefact M5 indisponible ou incompatible."},
        500: {"description": "Échec inattendu de l'inférence."},
    },
)
def create_prediction(
    payload: PredictionRequest,
    production_repository: ProductionRepositoryDependency,
    artifact: M5ArtifactDependency,
) -> PredictionResponse:
    """Exécute M5 et assemble le contexte historique nécessaire au Screen 4."""
    try:
        result = build_prediction(
            production_repository.get_all(),
            artifact,
            province=payload.province,
            culture_key=payload.culture,
            superficie_ha=payload.superficie_ha,
            campagne=payload.campagne,
        )
        return PredictionResponse.model_validate(result)
    except PredictionInputError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": error.code,
                "field": error.field,
                "message": error.message,
            },
        ) from error
    except M5ArtifactError as error:
        logger.exception("Artefact M5 incompatible pendant l'inférence.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "prediction_model_unavailable",
                "message": "Modèle de prédiction indisponible.",
            },
        ) from error
    except Exception as error:
        logger.exception("Erreur inattendue pendant la prédiction M5.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "prediction_failed",
                "message": "La prédiction n'a pas pu être calculée.",
            },
        ) from error
