from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

MISSING_FILTER_VALUE = "non-renseigne"
CONFLICT_FLAG = "conflit_sources_a_exclure"

FILTER_COLUMNS = {
    "provinces": "province",
    "cultures": "culture_analyse",
    "types_environnement": "type_environnement",
    "modes_irrigation": "mode_irrigation",
    "campagnes": "campagne",
}


@dataclass(frozen=True)
class ProductionFilters:
    """Sélections applicables aux lignes de production."""

    provinces: tuple[str, ...] = ()
    cultures: tuple[str, ...] = ()
    types_environnement: tuple[str, ...] = ()
    modes_irrigation: tuple[str, ...] = ()
    campagnes: tuple[str, ...] = ()


@dataclass(frozen=True)
class FilterResult:
    """Lignes admissibles et nombre de conflits retirés."""

    rows: pd.DataFrame
    rows_excluded: int


def _matches_selected_values(
    series: pd.Series,
    selected_values: tuple[str, ...],
) -> pd.Series:
    """Construit le masque d'une dimension, y compris Non renseigné."""
    known_values = tuple(value for value in selected_values if value != MISSING_FILTER_VALUE)
    mask = series.isin(known_values)

    # La valeur publique non-renseigne représente un null, pas une chaîne du CSV.
    if MISSING_FILTER_VALUE in selected_values:
        mask = mask | series.isna()

    return mask


def apply_production_filters(
    data: pd.DataFrame,
    filters: ProductionFilters,
) -> FilterResult:
    """Applique les filtres communs puis exclut les conflits de source."""
    filtered = data

    # Chaque sélection est un OU ; les dimensions successives forment un ET.
    for field_name, column_name in FILTER_COLUMNS.items():
        selected_values = getattr(filters, field_name)
        if selected_values:
            mask = _matches_selected_values(
                filtered[column_name],
                selected_values,
            )
            filtered = filtered.loc[mask]

    # Le compteur décrit uniquement les conflits du périmètre demandé.
    conflicts = filtered["qualite_production"].eq(CONFLICT_FLAG).fillna(False)

    return FilterResult(
        rows=filtered.loc[~conflicts].copy(deep=True),
        rows_excluded=int(conflicts.sum()),
    )
