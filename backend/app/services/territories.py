from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from app.data_contracts.territory_editorial import (
    EDITORIAL_SOURCE_BY_KEY,
    SOUSS_MASSA_EDITORIAL,
    EditorialSource,
)
from app.data_contracts.territory_geo import (
    TERRITORIES,
    TERRITORY_BY_SLUG,
)
from app.repositories.territory_repository import TerritoryGeoRepository
from app.services.territory_climate import (
    TerritoryClimateSummary,
    build_territory_climate_summary,
)
from app.services.territory_statistics import (
    AreaBenchmarks,
    ObservedPractice,
    RankingItem,
    TerritoryProductionCoverage,
    UnknownTerritoryError,
    build_territory_production_statistics,
)


@dataclass(frozen=True)
class TerritoryPeriod:
    start_campaign: str | None
    end_campaign: str | None


@dataclass(frozen=True)
class MetricRankings:
    production: list[RankingItem]
    yield_: list[RankingItem]


@dataclass(frozen=True)
class TerritoryRankings:
    families: MetricRankings
    cultures: MetricRankings


@dataclass(frozen=True)
class TerritoryPractices:
    environment: ObservedPractice
    irrigation: ObservedPractice


@dataclass(frozen=True)
class TerritoryProfile:
    has_data: bool
    coverage: TerritoryProductionCoverage
    area_benchmarks: AreaBenchmarks
    rankings: TerritoryRankings
    practices: TerritoryPractices
    climate_summary: TerritoryClimateSummary


@dataclass(frozen=True)
class RegionEditorialPayload:
    paragraph: str
    scope_note: str
    sources: tuple[EditorialSource, ...]


@dataclass(frozen=True)
class RegionTerritoryData:
    slug: str
    label: str
    scope_label: str
    period: TerritoryPeriod
    editorial: RegionEditorialPayload
    profile: TerritoryProfile


@dataclass(frozen=True)
class TerritoryListItem:
    province_slug: str
    province_label: str
    administrative_type: str
    has_data: bool


@dataclass(frozen=True)
class GeoAttribution:
    source_name: str
    source_url: str
    license_name: str
    license_url: str
    source_version: str
    modified: bool


@dataclass(frozen=True)
class TerritoriesOverview:
    region: RegionTerritoryData
    territories: list[TerritoryListItem]
    geojson: dict[str, Any]
    attribution: GeoAttribution


@dataclass(frozen=True)
class TerritoryDetail:
    has_data: bool
    territory: TerritoryListItem
    coverage: TerritoryProductionCoverage
    area_benchmarks: AreaBenchmarks
    rankings: TerritoryRankings
    practices: TerritoryPractices
    climate_summary: TerritoryClimateSummary


def _profile(
    production_data: pd.DataFrame,
    climate_data: pd.DataFrame,
    *,
    province_slug: str | None,
) -> TerritoryProfile:
    production = build_territory_production_statistics(
        production_data,
        province_slug=province_slug,
    )
    climate = build_territory_climate_summary(
        climate_data,
        province_slug=province_slug,
    )

    return TerritoryProfile(
        has_data=production.has_data,
        coverage=production.coverage,
        area_benchmarks=production.area_benchmarks,
        rankings=TerritoryRankings(
            families=MetricRankings(
                production=production.family_production,
                yield_=production.family_yield,
            ),
            cultures=MetricRankings(
                production=production.culture_production,
                yield_=production.culture_yield,
            ),
        ),
        practices=TerritoryPractices(
            environment=production.environment,
            irrigation=production.irrigation,
        ),
        climate_summary=climate,
    )


def _editorial_sources() -> tuple[EditorialSource, ...]:
    keys: list[str] = []
    for fact in SOUSS_MASSA_EDITORIAL.facts:
        for key in fact.source_keys:
            if key not in keys:
                keys.append(key)
    for key in SOUSS_MASSA_EDITORIAL.data_source_keys:
        if key not in keys:
            keys.append(key)
    return tuple(EDITORIAL_SOURCE_BY_KEY[key] for key in keys)


def _attribution(repository: TerritoryGeoRepository) -> GeoAttribution:
    metadata = repository.metadata
    modifications = metadata["modifications"]
    return GeoAttribution(
        source_name=str(metadata["dataset_title"]),
        source_url=str(metadata["source_url"]),
        license_name=str(metadata["license_name"]),
        license_url=str(metadata["license_url"]),
        source_version=str(metadata["source_version"]),
        modified=isinstance(modifications, list) and bool(modifications),
    )


def build_territories_overview(
    production_data: pd.DataFrame,
    climate_data: pd.DataFrame,
    geo_repository: TerritoryGeoRepository,
) -> TerritoriesOverview:
    """Assemble la vue régionale, la carte et la liste sélectionnable."""
    region_profile = _profile(
        production_data,
        climate_data,
        province_slug=None,
    )

    territories = []
    for definition in TERRITORIES:
        territory_profile = _profile(
            production_data,
            climate_data,
            province_slug=definition.province_slug,
        )
        territories.append(
            TerritoryListItem(
                province_slug=definition.province_slug,
                province_label=definition.province_label,
                administrative_type=definition.administrative_type,
                has_data=territory_profile.has_data,
            )
        )

    return TerritoriesOverview(
        region=RegionTerritoryData(
            slug=SOUSS_MASSA_EDITORIAL.slug,
            label=SOUSS_MASSA_EDITORIAL.label,
            scope_label=SOUSS_MASSA_EDITORIAL.scope_label,
            period=TerritoryPeriod(
                start_campaign=region_profile.coverage.start_campaign,
                end_campaign=region_profile.coverage.end_campaign,
            ),
            editorial=RegionEditorialPayload(
                paragraph=SOUSS_MASSA_EDITORIAL.paragraph,
                scope_note=SOUSS_MASSA_EDITORIAL.scope_note,
                sources=_editorial_sources(),
            ),
            profile=region_profile,
        ),
        territories=territories,
        geojson=geo_repository.geojson,
        attribution=_attribution(geo_repository),
    )


def build_territory_detail(
    production_data: pd.DataFrame,
    climate_data: pd.DataFrame,
    *,
    province_slug: str,
) -> TerritoryDetail:
    """Assemble la fiche d'un territoire couvert."""
    definition = TERRITORY_BY_SLUG.get(province_slug)
    if definition is None:
        raise UnknownTerritoryError(f"Territoire inconnu: {province_slug}")

    profile = _profile(
        production_data,
        climate_data,
        province_slug=province_slug,
    )
    territory = TerritoryListItem(
        province_slug=definition.province_slug,
        province_label=definition.province_label,
        administrative_type=definition.administrative_type,
        has_data=profile.has_data,
    )

    return TerritoryDetail(
        has_data=profile.has_data,
        territory=territory,
        coverage=profile.coverage,
        area_benchmarks=profile.area_benchmarks,
        rankings=profile.rankings,
        practices=profile.practices,
        climate_summary=profile.climate_summary,
    )
