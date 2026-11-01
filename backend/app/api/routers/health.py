from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Vérifier l'état de l'API",
    description="Confirme que le socle de l'API répond. Le CSV sera chargé en phase 2.",
)
def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", api_version=settings.app_version, data_status="not_loaded")
