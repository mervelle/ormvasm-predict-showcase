from __future__ import annotations

from dataclasses import dataclass, replace

import pandas as pd

from app.services.production_aggregations import (
    CategoryDistributionItem,
    CultureDistributionItem,
    CultureIndicator,
    EvolutionPoint,
    aggregate_category_distribution,
    aggregate_culture_distribution,
    aggregate_evolution,
    aggregate_metrics,
)
from app.services.production_filters import (
    ProductionFilters,
    apply_production_filters,
)
from app.services.production_metadata import validate_filter_values


@dataclass(frozen=True)
class OverviewCoverage:
    rows_used: int
    rows_excluded: int
    missing_production: int


@dataclass(frozen=True)
class ProductionOverviewData:
    has_data: bool
    coverage: OverviewCoverage
    evolution: list[EvolutionPoint]
    environment_distribution: list[CategoryDistributionItem]
    irrigation_distribution: list[CategoryDistributionItem]
    culture_distribution: list[CultureDistributionItem]


def build_production_overview(
    data: pd.DataFrame,
    filters: ProductionFilters,
    *,
    culture_campaign: str | None,
    culture_indicator: CultureIndicator,
) -> ProductionOverviewData:
    """Construit les blocs métier nécessaires au Screen 1."""
    validate_filter_values(
        data,
        filters,
        culture_campaign=culture_campaign,
    )

    filtered_result = apply_production_filters(data, filters)
    rows = filtered_result.rows
    metrics = aggregate_metrics(rows)

    # Le paramètre campagne est volontairement local au classement cultures.
    culture_filters = replace(
        filters,
        campagnes=(culture_campaign,) if culture_campaign else (),
    )
    culture_rows = apply_production_filters(data, culture_filters).rows

    # La référence conserve tout le périmètre sauf la sélection culture.
    comparison_filters = replace(culture_filters, cultures=())
    comparison_rows = apply_production_filters(data, comparison_filters).rows

    return ProductionOverviewData(
        has_data=not rows.empty,
        coverage=OverviewCoverage(
            rows_used=metrics.rows_used,
            rows_excluded=filtered_result.rows_excluded,
            missing_production=metrics.missing_production,
        ),
        evolution=aggregate_evolution(rows),
        environment_distribution=aggregate_category_distribution(
            rows,
            "type_environnement",
        ),
        irrigation_distribution=aggregate_category_distribution(
            rows,
            "mode_irrigation",
        ),
        culture_distribution=aggregate_culture_distribution(
            culture_rows,
            culture_indicator,
            selected_cultures=filters.cultures,
            comparison_rows=comparison_rows,
        ),
    )
