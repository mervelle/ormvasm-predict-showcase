from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from app.data_contracts.climate import CLIMATE_FACTORS, ClimateFactorDefinition
from app.services.production_aggregations import aggregate_metrics
from app.services.production_filters import ProductionFilters, apply_production_filters
from app.services.production_metadata import DISPLAY_LABELS, validate_filter_values

AGRICULTURAL_METRICS = {
    "production": ("Production", "t"),
    "rendement": ("Rendement pondéré", "t/ha"),
}


class InvalidClimateFactorError(ValueError):
    """Signale un facteur absent du contrat climatique public."""


@dataclass(frozen=True)
class MetricMetadata:
    value: str
    label: str
    unit: str


@dataclass(frozen=True)
class FactorMetadata:
    value: str
    label: str
    unit: str
    group: str
    description: str


@dataclass(frozen=True)
class ClimateProductionPoint:
    campagne: str
    annee_debut: int
    agricultural_value: float | None
    climate_value: float | None
    rows_used: int
    missing_production: int


@dataclass(frozen=True)
class ProvinceClimateSeries:
    province: str
    province_label: str
    points: list[ClimateProductionPoint]


@dataclass(frozen=True)
class ClimateProductionCoverage:
    rows_used: int
    rows_excluded: int
    missing_production: int
    agricultural_points_available: int
    agricultural_points_missing: int
    climate_points_available: int
    climate_points_missing: int


@dataclass(frozen=True)
class ClimateProductionData:
    has_data: bool
    coverage: ClimateProductionCoverage
    agricultural_metric: MetricMetadata
    selected_factor: FactorMetadata
    available_factors: list[FactorMetadata]
    series: list[ProvinceClimateSeries]


def _factor_metadata(
    value: str,
    definition: ClimateFactorDefinition,
) -> FactorMetadata:
    return FactorMetadata(
        value=value,
        label=definition.label,
        unit=definition.unit,
        group=definition.group,
        description=definition.description,
    )


def _available_factors() -> list[FactorMetadata]:
    return [
        _factor_metadata(value, definition)
        for value, definition in CLIMATE_FACTORS.items()
    ]


def _metric_metadata(indicator: str) -> MetricMetadata:
    label, unit = AGRICULTURAL_METRICS[indicator]
    return MetricMetadata(value=indicator, label=label, unit=unit)


def _province_axis(
    production_data: pd.DataFrame,
    filters: ProductionFilters,
) -> list[str]:
    available = set(production_data["province"].dropna().astype(str).unique())
    ordered = [province for province in DISPLAY_LABELS if province in available]

    if filters.provinces:
        selected = set(filters.provinces)
        return [province for province in ordered if province in selected]

    return ordered


def _campaign_axis(
    production_data: pd.DataFrame,
    climate_data: pd.DataFrame,
) -> list[tuple[int, str]]:
    production_campaigns = production_data.loc[
        :, ["annee_debut", "campagne"]
    ]
    climate_campaigns = climate_data.loc[:, ["annee_debut", "campagne"]]
    campaigns = pd.concat(
        [production_campaigns, climate_campaigns],
        ignore_index=True,
    ).drop_duplicates()
    campaigns = campaigns.sort_values(
        ["annee_debut", "campagne"],
        kind="stable",
    )
    return [
        (int(row.annee_debut), str(row.campagne))
        for row in campaigns.itertuples(index=False)
    ]


def _agricultural_value(
    rows: pd.DataFrame | None,
    indicator: str,
) -> tuple[float | None, int, int]:
    if rows is None or rows.empty:
        return None, 0, 0

    metrics = aggregate_metrics(rows)
    value = (
        metrics.production_t
        if indicator == "production"
        else metrics.rendement_t_ha
    )
    return value, metrics.rows_used, metrics.missing_production


def build_climate_production_series(
    production_data: pd.DataFrame,
    climate_data: pd.DataFrame,
    filters: ProductionFilters,
    *,
    agricultural_indicator: str,
    climate_factor: str,
) -> ClimateProductionData:
    """Construit des séries séparées par province, sans agréger le climat."""
    validate_filter_values(
        production_data,
        filters,
        culture_campaign=None,
    )

    if agricultural_indicator not in AGRICULTURAL_METRICS:
        raise ValueError("Indicateur agricole invalide.")

    factor_definition = CLIMATE_FACTORS.get(climate_factor)
    if factor_definition is None:
        raise InvalidClimateFactorError("Facteur climatique invalide.")

    filtered_result = apply_production_filters(production_data, filters)
    rows = filtered_result.rows
    selected_factor = _factor_metadata(climate_factor, factor_definition)
    available_factors = _available_factors()
    agricultural_metric = _metric_metadata(agricultural_indicator)

    if rows.empty:
        return ClimateProductionData(
            has_data=False,
            coverage=ClimateProductionCoverage(
                rows_used=0,
                rows_excluded=filtered_result.rows_excluded,
                missing_production=0,
                agricultural_points_available=0,
                agricultural_points_missing=0,
                climate_points_available=0,
                climate_points_missing=0,
            ),
            agricultural_metric=agricultural_metric,
            selected_factor=selected_factor,
            available_factors=available_factors,
            series=[],
        )

    agricultural_groups = {
        (str(province), str(campaign)): group
        for (province, campaign), group in rows.groupby(
            ["province", "campagne"],
            sort=False,
        )
    }
    climate_lookup = {
        (str(row.province), str(row.campagne)): row
        for row in climate_data.itertuples(index=False)
    }

    campaigns = _campaign_axis(production_data, climate_data)
    provinces = _province_axis(production_data, filters)
    series: list[ProvinceClimateSeries] = []

    agricultural_points_available = 0
    agricultural_points_missing = 0
    climate_points_available = 0
    climate_points_missing = 0

    for province in provinces:
        points: list[ClimateProductionPoint] = []

        for start_year, campaign in campaigns:
            agricultural_value, rows_used, missing_production = (
                _agricultural_value(
                    agricultural_groups.get((province, campaign)),
                    agricultural_indicator,
                )
            )
            climate_row = climate_lookup.get((province, campaign))
            climate_value = (
                None
                if climate_row is None
                else float(getattr(climate_row, factor_definition.column))
            )

            if agricultural_value is None:
                agricultural_points_missing += 1
            else:
                agricultural_points_available += 1

            if climate_value is None:
                climate_points_missing += 1
            else:
                climate_points_available += 1

            points.append(
                ClimateProductionPoint(
                    campagne=campaign,
                    annee_debut=start_year,
                    agricultural_value=agricultural_value,
                    climate_value=climate_value,
                    rows_used=rows_used,
                    missing_production=missing_production,
                )
            )

        series.append(
            ProvinceClimateSeries(
                province=province,
                province_label=DISPLAY_LABELS.get(
                    province,
                    province.capitalize(),
                ),
                points=points,
            )
        )

    return ClimateProductionData(
        has_data=True,
        coverage=ClimateProductionCoverage(
            rows_used=len(rows),
            rows_excluded=filtered_result.rows_excluded,
            missing_production=int(rows["production_t"].isna().sum()),
            agricultural_points_available=agricultural_points_available,
            agricultural_points_missing=agricultural_points_missing,
            climate_points_available=climate_points_available,
            climate_points_missing=climate_points_missing,
        ),
        agricultural_metric=agricultural_metric,
        selected_factor=selected_factor,
        available_factors=available_factors,
        series=series,
    )
