from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PIAD-Agri API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    dataset_path: Path = Path("data/dataset_production_final_hcp_corrected.csv")
    climate_dataset_path: Path = Path("data/dataset_prodXclimat_hcp_corrected.csv")
    territory_geojson_path: Path = Path("data/geo/territories_souss_massa.geojson")
    territory_geo_metadata_path: Path = Path("data/geo/territories_souss_massa.metadata.json")
    m5_model_path: Path = Path("models/m5/v1.0.0")
    raw_data_source_path: Path = Path("data/production_dt.xlsx")
    raw_data_sheet_name: str = "BD 2"
    raw_data_additions_path: Path = Path("data/raw_data_additions.jsonl")


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    


@lru_cache
def get_settings() -> Settings:
    return Settings()
