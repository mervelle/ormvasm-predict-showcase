from __future__ import annotations

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        populate_by_name=True,
    )


class TerritoryPeriodResponse(StrictModel):
    start_campaign: str | None
    end_campaign: str | None


class EditorialSourceResponse(StrictModel):
    key: str
    source_kind: str
    source_title: str
    source_organization: str
    source_url: str | None
    accessed_at: date
    scope_note: str


class RegionEditorialResponse(StrictModel):
    paragraph: str
    scope_note: str
    sources: tuple[EditorialSourceResponse, ...]


class TerritoryListItemResponse(StrictModel):
    province_slug: str
    province_label: str
    administrative_type: str
    has_data: bool


class AreaExtremeResponse(StrictModel):
    campaign: str
    value_ha: float
    has_tie: bool


class AreaBenchmarksResponse(StrictModel):
    average_ha: float | None
    minimum: AreaExtremeResponse | None
    maximum: AreaExtremeResponse | None
    campaigns_available: int


class RankingItemResponse(StrictModel):
    rank: int
    family: str
    culture: str | None
    label: str
    value: float
    unit: str
    valid_campaigns: int
    covered_area_ha: float


class MetricRankingsResponse(StrictModel):
    production: list[RankingItemResponse]
    yield_items: list[RankingItemResponse] = Field(
        validation_alias="yield_",
        serialization_alias="yield",
    )


class TerritoryRankingsResponse(StrictModel):
    families: MetricRankingsResponse
    cultures: MetricRankingsResponse


class ObservedPracticeResponse(StrictModel):
    dominant_value: str | None
    dominant_label: str | None
    dominant_area_ha: float | None
    dominant_share_known_pct: float | None
    known_area_ha: float
    missing_area_ha: float
    missing_share_total_pct: float | None
    total_area_ha: float


class TerritoryPracticesResponse(StrictModel):
    environment: ObservedPracticeResponse
    irrigation: ObservedPracticeResponse


class TerritoryCoverageResponse(StrictModel):
    rows_used: int
    rows_excluded: int
    missing_production: int
    campaigns_available: int
    start_campaign: str | None
    end_campaign: str | None


class TerritoryClimateSummaryResponse(StrictModel):
    temperature_mean_c: float | None
    precipitation_median_mm: float | None
    et0_median_mm: float | None
    deficit_median_mm: float | None
    wind_mean_m_s: float | None
    campaigns_available: int
    campaigns_expected: int
    observations_available: int
    observations_expected: int
    territories_available: int
    territories_expected: int
    start_campaign: str | None
    end_campaign: str | None
    source: str
    scope_note: str


class TerritoryProfileResponse(StrictModel):
    has_data: bool
    coverage: TerritoryCoverageResponse
    area_benchmarks: AreaBenchmarksResponse
    rankings: TerritoryRankingsResponse
    practices: TerritoryPracticesResponse
    climate_summary: TerritoryClimateSummaryResponse


Position = tuple[float, float]
LinearRing = list[Position]
PolygonCoordinates = list[LinearRing]
MultiPolygonCoordinates = list[PolygonCoordinates]


class PolygonGeometryResponse(StrictModel):
    type: Literal["Polygon"]
    coordinates: PolygonCoordinates


class MultiPolygonGeometryResponse(StrictModel):
    type: Literal["MultiPolygon"]
    coordinates: MultiPolygonCoordinates


GeoJSONGeometryResponse = Annotated[
    PolygonGeometryResponse | MultiPolygonGeometryResponse,
    Field(discriminator="type"),
]


class GeoJSONPropertiesResponse(StrictModel):
    province_slug: str
    province_label: str
    administrative_type: str
    source_name: str
    has_production_data: bool


class GeoJSONFeatureResponse(StrictModel):
    type: Literal["Feature"]
    properties: GeoJSONPropertiesResponse
    geometry: GeoJSONGeometryResponse


class GeoJSONFeatureCollectionResponse(StrictModel):
    type: Literal["FeatureCollection"]
    features: list[GeoJSONFeatureResponse]


class GeoAttributionResponse(StrictModel):
    source_name: str
    source_url: str
    license_name: str
    license_url: str
    source_version: str
    modified: bool


class RegionTerritoryResponse(StrictModel):
    slug: str
    label: str
    scope_label: str
    period: TerritoryPeriodResponse
    editorial: RegionEditorialResponse
    profile: TerritoryProfileResponse


class TerritoriesResponse(StrictModel):
    region: RegionTerritoryResponse
    territories: list[TerritoryListItemResponse]
    geojson: GeoJSONFeatureCollectionResponse
    attribution: GeoAttributionResponse


class TerritoryDetailResponse(StrictModel):
    has_data: bool
    territory: TerritoryListItemResponse
    coverage: TerritoryCoverageResponse
    area_benchmarks: AreaBenchmarksResponse
    rankings: TerritoryRankingsResponse
    practices: TerritoryPracticesResponse
    climate_summary: TerritoryClimateSummaryResponse
