from __future__ import annotations

from dataclasses import dataclass
import math

import pandas as pd

from app.repositories.raw_data_repository import RAW_DATA_COLUMNS


MISSING_FILTER_VALUE = "non-renseigne"

FILTER_COLUMNS = {
    "provinces": "PROVINCES",
    "cultures": "CULTURES",
    "types_1": "TYPE 1",
    "types_2": "TYPE2",
}


@dataclass(frozen=True)
class RawDataFilters:
    provinces: tuple[str, ...] = ()
    cultures: tuple[str, ...] = ()
    types_1: tuple[str, ...] = ()
    types_2: tuple[str, ...] = ()


@dataclass(frozen=True)
class RawDataPage:
    columns: list[str]
    rows: list[dict[str, object]]
    total: int
    offset: int
    limit: int
    next_offset: int | None


def _is_missing(value: object) -> bool:
    if value is None:
        return True

    if isinstance(value, str):
        return value.strip() == ""

    if isinstance(value, float):
        return math.isnan(value)

    try:
        result = pd.isna(value)
    except (TypeError, ValueError):
        return False

    return bool(result) if isinstance(result, bool) else False


def _matches(
    series: pd.Series,
    selected: tuple[str, ...],
) -> pd.Series:
    known_values = tuple(
        value
        for value in selected
        if value != MISSING_FILTER_VALUE
    )

    mask = series.isin(known_values)

    if MISSING_FILTER_VALUE in selected:
        missing_mask = series.map(_is_missing)
        mask = mask | missing_mask

    return mask


def apply_raw_data_filters(
    data: pd.DataFrame,
    filters: RawDataFilters,
) -> pd.DataFrame:
    """Filtre les lignes sans modifier leurs valeurs ni leur ordre."""
    filtered = data

    for field, column in FILTER_COLUMNS.items():
        selected = getattr(filters, field)
        if not selected:
            continue

        filtered = filtered.loc[
            _matches(filtered[column], selected)
        ]

    return filtered.copy()


def _python_value(value: object) -> object:
    if _is_missing(value):
        return ""

    item = getattr(value, "item", None)
    if callable(item):
        return item()

    return value


def _rows(frame: pd.DataFrame) -> list[dict[str, object]]:
    return [
        {
            column: _python_value(row[column])
            for column in RAW_DATA_COLUMNS
        }
        for _, row in frame.iterrows()
    ]


def _filter_options(
    series: pd.Series,
) -> list[dict[str, str]]:
    values = sorted(
        {
            str(value)
            for value in series
            if not _is_missing(value)
        }
    )

    options = [
        {
            "value": value,
            "label": value,
        }
        for value in values
    ]

    if series.map(_is_missing).any():
        options.append(
            {
                "value": MISSING_FILTER_VALUE,
                "label": "Non renseigné",
            }
        )

    return options


def build_raw_data_options(
    data: pd.DataFrame,
) -> dict[str, list[dict[str, str]]]:
    return {
        "provinces": _filter_options(data["PROVINCES"]),
        "cultures": _filter_options(data["CULTURES"]),
        "types_1": _filter_options(data["TYPE 1"]),
        "types_2": _filter_options(data["TYPE2"]),
    }


def build_raw_data_page(
    data: pd.DataFrame,
    *,
    filters: RawDataFilters,
    offset: int,
    limit: int,
) -> RawDataPage:
    filtered = apply_raw_data_filters(data, filters)
    total = len(filtered)

    page = filtered.iloc[offset : offset + limit]
    next_offset = (
        offset + limit
        if offset + limit < total
        else None
    )

    return RawDataPage(
        columns=list(RAW_DATA_COLUMNS),
        rows=_rows(page),
        total=total,
        offset=offset,
        limit=limit,
        next_offset=next_offset,
    )


def build_raw_data_export(
    data: pd.DataFrame,
    *,
    filters: RawDataFilters,
) -> pd.DataFrame:
    """Retourne toutes les lignes filtrées pour l'export."""
    return apply_raw_data_filters(
        data,
        filters,
    ).loc[:, list(RAW_DATA_COLUMNS)]
