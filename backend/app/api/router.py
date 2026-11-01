from fastapi import APIRouter
from app.api.routers import climate_production, health, metadata, production, territories , predictions ,raw_data


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(metadata.router)
api_router.include_router(production.router)
api_router.include_router(climate_production.router)
api_router.include_router(territories.router)
api_router.include_router(predictions.router)
api_router.include_router(raw_data.router)

