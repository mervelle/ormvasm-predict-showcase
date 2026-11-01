from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Literal

import pandas as pd

from app.services.production_filters import MISSING_FILTER_VALUE

CultureIndicator = Literal["production", "superficie", "rendement"]

CATEGORY_ORDERS = {
    "type_environnement": ("sous serre", "plein champ", MISSING_FILTER_VALUE),
    "mode_irrigation": ("irrigue", "bour", MISSING_FILTER_VALUE),
}


@dataclass(frozen=True)
class AggregateMetrics:
    production_t: float | None
    superficie_ha: float | None
    rendement_t_ha: float | None
    rows_used: int
    missing_production: int


@dataclass(frozen=True)
class EvolutionPoint:
    campagne: str
    annee_debut: int
    production_t: float | None
    superficie_ha: float | None
    rendement_t_ha: float | None
    rows_used: int
    missing_production: int


@dataclass(frozen=True)
class CategoryDistributionItem:
    value: str
    superficie_ha: float
    part_pct: float


@dataclass(frozen=True)
class CultureDistributionItem:
    culture: str
    value: float | None
    part_pct: float | None
    rows_used: int
    missing_production: int


def _sum_or_none(series: pd.Series) -> float | None:
    value = series.sum(min_count=1)
    return None if pd.isna(value) else float(value)


def aggregate_metrics(rows: pd.DataFrame) -> AggregateMetrics:
    """Calcule les totaux et le rendement pondéré d'un groupe de lignes."""
    production = _sum_or_none(rows["production_t"])
    superficie = _sum_or_none(rows["superficie_ha"])

    known_production = rows.loc[rows["production_t"].notna()]
    corresponding_area = _sum_or_none(known_production["superficie_ha"])

    # La surface d'une production inconnue reste dans la superficie totale,
    # mais n'entre pas dans le dénominateur du rendement pondéré.
    weighted_yield = None
    if production is not None and corresponding_area is not None and corresponding_area > 0:
        weighted_yield = production / corresponding_area

    return AggregateMetrics(
        production_t=production,
        superficie_ha=superficie,
        rendement_t_ha=weighted_yield,
        rows_used=len(rows),
        missing_production=int(rows["production_t"].isna().sum()),
    )


def aggregate_evolution(rows: pd.DataFrame) -> list[EvolutionPoint]:
    """Agrège les mesures par campagne dans l'ordre chronologique."""
    points: list[EvolutionPoint] = []
    grouped = rows.groupby(["annee_debut", "campagne"], sort=True, dropna=False)

    for (start_year, campaign), group in grouped:
        metrics = aggregate_metrics(group)
        points.append(
            EvolutionPoint(
                campagne=str(campaign),
                annee_debut=int(start_year),
                production_t=metrics.production_t,
                superficie_ha=metrics.superficie_ha,
                rendement_t_ha=metrics.rendement_t_ha,
                rows_used=metrics.rows_used,
                missing_production=metrics.missing_production,
            )
        )

    return points


def aggregate_category_distribution(
    rows: pd.DataFrame,
    column: Literal["type_environnement", "mode_irrigation"],
) -> list[CategoryDistributionItem]:
    """Calcule la part de superficie de chaque catégorie, null compris."""
    total_area = _sum_or_none(rows["superficie_ha"])
    if total_area is None or total_area <= 0:
        return []

    items: list[CategoryDistributionItem] = []

    for category, group in rows.groupby(column, dropna=False, sort=False):
        area = _sum_or_none(group["superficie_ha"])
        if area is None:
            continue

        value = MISSING_FILTER_VALUE if pd.isna(category) else str(category)
        items.append(
            CategoryDistributionItem(
                value=value,
                superficie_ha=area,
                part_pct=area / total_area * 100,
            )
        )

    order = {value: index for index, value in enumerate(CATEGORY_ORDERS[column])}
    return sorted(
        items,
        key=lambda item: (order.get(item.value, len(order)), item.value),
    )


def _indicator_value(
    metrics: AggregateMetrics,
    indicator: CultureIndicator,
) -> float | None:
    if indicator == "production":
        return metrics.production_t
    if indicator == "superficie":
        return metrics.superficie_ha
    return metrics.rendement_t_ha


def _culture_item(
    culture: str,
    rows: pd.DataFrame,
    indicator: CultureIndicator,
) -> CultureDistributionItem:
    metrics = aggregate_metrics(rows)
    return CultureDistributionItem(
        culture=culture,
        value=_indicator_value(metrics, indicator),
        part_pct=None,
        rows_used=metrics.rows_used,
        missing_production=metrics.missing_production,
    )


def _add_parts(
    items: list[CultureDistributionItem],
    total_value: float | None,
) -> list[CultureDistributionItem]:
    if total_value is None or total_value == 0:
        return items

    return [
        replace(
            item,
            part_pct=None if item.value is None else item.value / total_value * 100,
        )
        for item in items
    ]


def _rank_all_cultures(
    rows: pd.DataFrame,
    indicator: CultureIndicator,
) -> list[CultureDistributionItem]:
    items = [
        _culture_item(str(culture), group, indicator)
        for culture, group in rows.groupby("culture_analyse", sort=False)
    ]

    items.sort(
        key=lambda item: (
            item.value is None,
            -(item.value or 0.0),
            item.culture,
        )
    )

    if indicator == "rendement":
        return [item for item in items if item.value is not None]

    total_value = _indicator_value(aggregate_metrics(rows), indicator)
    return _add_parts(items, total_value)


def _compare_selection_with_others(
    comparison_rows: pd.DataFrame,
    selected_cultures: tuple[str, ...],
    indicator: CultureIndicator,
) -> list[CultureDistributionItem]:
    selected_mask = comparison_rows["culture_analyse"].isin(selected_cultures)
    selected_rows = comparison_rows.loc[selected_mask]
    other_rows = comparison_rows.loc[~selected_mask]

    if selected_rows.empty:
        return []

    items = [_culture_item("selection", selected_rows, indicator)]
    if not other_rows.empty:
        items.append(_culture_item("autres", other_rows, indicator))

    if indicator == "rendement":
        return items

    total_value = _indicator_value(aggregate_metrics(comparison_rows), indicator)
    return _add_parts(items, total_value)


def aggregate_culture_distribution(
    rows: pd.DataFrame,
    indicator: CultureIndicator,
    *,
    selected_cultures: tuple[str, ...] = (),
    comparison_rows: pd.DataFrame | None = None,
) -> list[CultureDistributionItem]:
    """Classe les cultures ou compare la sélection au reste du périmètre."""
    if selected_cultures:
        if comparison_rows is None:
            raise ValueError(
                "comparison_rows est requis avec une culture sélectionnée."
            )
        return _compare_selection_with_others(
            comparison_rows,
            selected_cultures,
            indicator,
        )

    return _rank_all_cultures(rows, indicator)
