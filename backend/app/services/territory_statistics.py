from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import pandas as pd

from app.data_contracts.territory import culture_label, family_label, practice_label
from app.data_contracts.territory_geo import TERRITORY_SLUGS
from app.services.production_aggregations import CATEGORY_ORDERS
from app.services.production_filters import ProductionFilters, apply_production_filters

RankingMetric = Literal["production", "rendement"]
PracticeColumn = Literal["type_environnement", "mode_irrigation"]

TIE_REL_TOL = 1e-9
TIE_ABS_TOL = 1e-9
MIN_YIELD_CAMPAIGNS = 3
TOP_LIMIT = 3


class UnknownTerritoryError(ValueError):
    """Signale un territoire absent du périmètre de données du projet."""


@dataclass(frozen=True)
class AreaExtreme:
    campaign: str
    value_ha: float
    has_tie: bool


@dataclass(frozen=True)
class AreaBenchmarks:
    average_ha: float | None
    minimum: AreaExtreme | None
    maximum: AreaExtreme | None
    campaigns_available: int


@dataclass(frozen=True)
class RankingItem:
    rank: int
    family: str
    culture: str | None
    label: str
    value: float
    unit: str
    valid_campaigns: int
    covered_area_ha: float


@dataclass(frozen=True)
class ObservedPractice:
    dominant_value: str | None
    dominant_label: str | None
    dominant_area_ha: float | None
    dominant_share_known_pct: float | None
    known_area_ha: float
    missing_area_ha: float
    missing_share_total_pct: float | None
    total_area_ha: float


@dataclass(frozen=True)
class TerritoryProductionCoverage:
    rows_used: int
    rows_excluded: int
    missing_production: int
    campaigns_available: int
    start_campaign: str | None
    end_campaign: str | None


@dataclass(frozen=True)
class TerritoryProductionStatistics:
    has_data: bool
    coverage: TerritoryProductionCoverage
    area_benchmarks: AreaBenchmarks
    family_production: list[RankingItem]
    family_yield: list[RankingItem]
    culture_production: list[RankingItem]
    culture_yield: list[RankingItem]
    environment: ObservedPractice
    irrigation: ObservedPractice


def _sum_or_zero(series: pd.Series) -> float:
    value = series.sum(min_count=1)
    return 0.0 if pd.isna(value) else float(value)


def _campaign_rows(rows: pd.DataFrame) -> pd.DataFrame:
    if rows.empty:
        return pd.DataFrame(columns=["annee_debut", "campagne", "superficie_ha"])

    return (
        rows.groupby(["annee_debut", "campagne"], as_index=False, sort=True)[
            "superficie_ha"
        ]
        .sum()
        .sort_values(["annee_debut", "campagne"], kind="stable", ignore_index=True)
    )


def _extreme(
    campaign_rows: pd.DataFrame,
    *,
    mode: Literal["minimum", "maximum"],
) -> AreaExtreme | None:
    if campaign_rows.empty:
        return None

    values = campaign_rows["superficie_ha"].astype(float)
    target = float(values.min() if mode == "minimum" else values.max())
    tied = campaign_rows.loc[
        values.map(
            lambda value: math.isclose(
                float(value),
                target,
                rel_tol=TIE_REL_TOL,
                abs_tol=TIE_ABS_TOL,
            )
        )
    ].sort_values(["annee_debut", "campagne"], kind="stable")

    selected = tied.iloc[0]
    return AreaExtreme(
        campaign=str(selected["campagne"]),
        value_ha=float(selected["superficie_ha"]),
        has_tie=len(tied) > 1,
    )


def build_area_benchmarks(rows: pd.DataFrame) -> AreaBenchmarks:
    """Calcule moyenne, minimum et maximum de superficie par campagne."""
    campaigns = _campaign_rows(rows)
    if campaigns.empty:
        return AreaBenchmarks(
            average_ha=None,
            minimum=None,
            maximum=None,
            campaigns_available=0,
        )

    return AreaBenchmarks(
        average_ha=float(campaigns["superficie_ha"].mean()),
        minimum=_extreme(campaigns, mode="minimum"),
        maximum=_extreme(campaigns, mode="maximum"),
        campaigns_available=len(campaigns),
    )


def _group_measure(
    group: pd.DataFrame,
    metric: RankingMetric,
) -> tuple[float, int, float] | None:
    known = group.loc[group["production_t"].notna()]
    if known.empty:
        return None

    production = float(known["production_t"].sum())
    covered_area = float(known["superficie_ha"].sum())
    valid_campaigns = int(known["campagne"].nunique())

    if metric == "rendement":
        if valid_campaigns < MIN_YIELD_CAMPAIGNS or covered_area <= 0:
            return None
        return production / covered_area, valid_campaigns, covered_area

    return production, valid_campaigns, covered_area


def _sort_rankings(items: list[RankingItem]) -> list[RankingItem]:
    ordered = sorted(
        items,
        key=lambda item: (
            -item.value,
            -item.covered_area_ha,
            -item.valid_campaigns,
            item.label.casefold(),
        ),
    )[:TOP_LIMIT]

    return [
        RankingItem(
            rank=index,
            family=item.family,
            culture=item.culture,
            label=item.label,
            value=item.value,
            unit=item.unit,
            valid_campaigns=item.valid_campaigns,
            covered_area_ha=item.covered_area_ha,
        )
        for index, item in enumerate(ordered, start=1)
    ]


def rank_families(rows: pd.DataFrame, metric: RankingMetric) -> list[RankingItem]:
    """Classe les familles avec une clé métier fondée sur `famille`."""
    unit = "t" if metric == "production" else "t/ha"
    items: list[RankingItem] = []

    for family, group in rows.groupby("famille", sort=False, dropna=False):
        if pd.isna(family):
            continue
        measure = _group_measure(group, metric)
        if measure is None:
            continue
        value, valid_campaigns, covered_area = measure
        family_value = str(family)
        items.append(
            RankingItem(
                rank=0,
                family=family_value,
                culture=None,
                label=family_label(family_value),
                value=value,
                unit=unit,
                valid_campaigns=valid_campaigns,
                covered_area_ha=covered_area,
            )
        )

    return _sort_rankings(items)


def rank_cultures(rows: pd.DataFrame, metric: RankingMetric) -> list[RankingItem]:
    """Classe les cultures avec la clé composite `(famille, culture_analyse)`."""
    unit = "t" if metric == "production" else "t/ha"
    items: list[RankingItem] = []

    grouped = rows.groupby(["famille", "culture_analyse"], sort=False, dropna=False)
    for (family, culture), group in grouped:
        if pd.isna(family) or pd.isna(culture):
            continue
        measure = _group_measure(group, metric)
        if measure is None:
            continue
        value, valid_campaigns, covered_area = measure
        family_value = str(family)
        culture_value = str(culture)
        items.append(
            RankingItem(
                rank=0,
                family=family_value,
                culture=culture_value,
                label=culture_label(family_value, culture_value),
                value=value,
                unit=unit,
                valid_campaigns=valid_campaigns,
                covered_area_ha=covered_area,
            )
        )

    return _sort_rankings(items)


def summarize_practice(rows: pd.DataFrame, column: PracticeColumn) -> ObservedPractice:
    """Décrit la modalité dominante connue et la part réellement non renseignée."""
    total_area = _sum_or_zero(rows["superficie_ha"])
    if total_area <= 0:
        return ObservedPractice(
            dominant_value=None,
            dominant_label=None,
            dominant_area_ha=None,
            dominant_share_known_pct=None,
            known_area_ha=0.0,
            missing_area_ha=0.0,
            missing_share_total_pct=None,
            total_area_ha=0.0,
        )

    known_rows = rows.loc[rows[column].notna()]
    missing_area = _sum_or_zero(rows.loc[rows[column].isna(), "superficie_ha"])
    known_area = _sum_or_zero(known_rows["superficie_ha"])

    if known_rows.empty or known_area <= 0:
        return ObservedPractice(
            dominant_value=None,
            dominant_label=None,
            dominant_area_ha=None,
            dominant_share_known_pct=None,
            known_area_ha=known_area,
            missing_area_ha=missing_area,
            missing_share_total_pct=missing_area / total_area * 100,
            total_area_ha=total_area,
        )

    category_areas = (
        known_rows.groupby(column, sort=False)["superficie_ha"].sum().astype(float)
    )
    order = {
        value: index
        for index, value in enumerate(CATEGORY_ORDERS[column])
        if value in category_areas.index
    }
    dominant_value, dominant_area = sorted(
        ((str(value), float(area)) for value, area in category_areas.items()),
        key=lambda item: (
            -item[1],
            order.get(item[0], len(order)),
            practice_label(item[0]).casefold(),
        ),
    )[0]

    return ObservedPractice(
        dominant_value=dominant_value,
        dominant_label=practice_label(dominant_value),
        dominant_area_ha=dominant_area,
        dominant_share_known_pct=dominant_area / known_area * 100,
        known_area_ha=known_area,
        missing_area_ha=missing_area,
        missing_share_total_pct=missing_area / total_area * 100,
        total_area_ha=total_area,
    )


def _coverage(rows: pd.DataFrame, rows_excluded: int) -> TerritoryProductionCoverage:
    campaigns = (
        rows.loc[:, ["annee_debut", "campagne"]]
        .drop_duplicates()
        .sort_values(["annee_debut", "campagne"], kind="stable")
    )
    if campaigns.empty:
        start_campaign = None
        end_campaign = None
    else:
        start_campaign = str(campaigns.iloc[0]["campagne"])
        end_campaign = str(campaigns.iloc[-1]["campagne"])

    return TerritoryProductionCoverage(
        rows_used=len(rows),
        rows_excluded=rows_excluded,
        missing_production=int(rows["production_t"].isna().sum()),
        campaigns_available=len(campaigns),
        start_campaign=start_campaign,
        end_campaign=end_campaign,
    )


def build_territory_production_statistics(
    data: pd.DataFrame,
    *,
    province_slug: str | None = None,
) -> TerritoryProductionStatistics:
    """Construit les agrégats agricoles d'une fiche régionale ou territoriale."""
    if province_slug is not None and province_slug not in TERRITORY_SLUGS:
        raise UnknownTerritoryError(f"Territoire inconnu: {province_slug}")

    filters = ProductionFilters(
        provinces=(province_slug,) if province_slug is not None else (),
    )
    filtered = apply_production_filters(data, filters)
    rows = filtered.rows

    return TerritoryProductionStatistics(
        has_data=not rows.empty,
        coverage=_coverage(rows, filtered.rows_excluded),
        area_benchmarks=build_area_benchmarks(rows),
        family_production=rank_families(rows, "production"),
        family_yield=rank_families(rows, "rendement"),
        culture_production=rank_cultures(rows, "production"),
        culture_yield=rank_cultures(rows, "rendement"),
        environment=summarize_practice(rows, "type_environnement"),
        irrigation=summarize_practice(rows, "mode_irrigation"),
    )
