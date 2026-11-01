from fastapi import APIRouter

from app.api.dependencies import ProductionRepositoryDependency
from app.schemas.metadata import FilterMetadataResponse
from app.services.production_metadata import build_filter_metadata

router = APIRouter(prefix="/metadata", tags=["Métadonnées"])


@router.get("/filters", response_model=FilterMetadataResponse)
def get_filter_metadata(
    repository: ProductionRepositoryDependency,
) -> FilterMetadataResponse:
    """Retourne les options de filtres et les unités du Screen 1."""
    metadata = build_filter_metadata(repository.get_all())
    return FilterMetadataResponse.model_validate(metadata)
