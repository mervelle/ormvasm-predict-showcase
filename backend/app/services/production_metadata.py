from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from app.services.production_filters import (
    FILTER_COLUMNS,
    MISSING_FILTER_VALUE,
    ProductionFilters,
    apply_production_filters,
)

DISPLAY_LABELS = {
    "agadir-ida-outanane": "Agadir-Ida-Outanane",
    "chtouka-aït baha": "Chtouka-Aït Baha",
    "inezgane aït melloul": "Inezgane Aït Melloul",
    "taroudant": "Taroudant",
    "sous serre": "Sous serre",
    "plein champ": "Plein champ",
    "irrigue": "Irrigué",
    "bour": "Bour",
    MISSING_FILTER_VALUE: "Non renseigné",
    "amandier": "Amandier",
    "arboricultures autres": "Arboricultures autres",
    "autres": "Autres",
    "bananier": "Bananier",
    "bersim/mais fourager": "Bersim/maïs fourrager",
    "ble dur": "Blé dur",
    "ble tendre": "Blé tendre",
    "clementine": "Clémentine",
    "floriculture": "Floriculture",
    "luzerne": "Luzerne",
    "mais grain": "Maïs grain",
    "maroc late": "Maroc Late",
    "navel": "Navel",
    "olivier": "Olivier",
    "orge": "Orge",
    "pasteque": "Pastèque",
    "poivron": "Poivron",
    "pomme de terre": "Pomme de terre",
    "tomate": "Tomate",
}

FILTER_PUBLIC_NAMES = {
    "provinces": "province",
    "cultures": "culture",
    "types_environnement": "type_environnement",
    "modes_irrigation": "mode_irrigation",
    "campagnes": "campagne",
}


@dataclass(frozen=True)
class FilterOptionData:
    value: str
    label: str


@dataclass(frozen=True)
class ProductionUnitsData:
    production_t: str = "t"
    superficie_ha: str = "ha"
    rendement_t_ha: str = "t/ha"
    part_pct: str = "%"


@dataclass(frozen=True)
class FilterMetadataData:
    provinces: list[FilterOptionData]
    cultures: list[FilterOptionData]
    campagnes: list[FilterOptionData]
    types_environnement: list[FilterOptionData]
    modes_irrigation: list[FilterOptionData]
    units: ProductionUnitsData


class InvalidFilterValueError(ValueError):
    """Signale une valeur absente des options de filtre disponibles."""

    def __init__(self, field: str, values: list[str]) -> None:
        self.field = field
        self.values = values
        super().__init__(f"Valeur invalide pour {field}.")


def _label(value: str) -> str:
    return DISPLAY_LABELS.get(value, value.capitalize())


def _options(
    series: pd.Series,
    *,
    include_missing: bool = False,
    campaign_order: bool = False,
) -> list[FilterOptionData]:
    values = [str(value) for value in series.dropna().unique()]

    if campaign_order:
        values.sort(key=lambda value: int(value.split("/")[0]))
    else:
        values.sort(key=lambda value: _label(value).casefold())

    options = [FilterOptionData(value=value, label=_label(value)) for value in values]

    if include_missing and series.isna().any():
        options.append(
            FilterOptionData(
                value=MISSING_FILTER_VALUE,
                label=DISPLAY_LABELS[MISSING_FILTER_VALUE],
            )
        )

    return options


def _admissible_rows(data: pd.DataFrame) -> pd.DataFrame:
    # Les métadonnées ne proposent pas une valeur présente uniquement
    # sur une ligne que le moteur commun exclut comme conflit.
    return apply_production_filters(data, ProductionFilters()).rows


def build_filter_metadata(data: pd.DataFrame) -> FilterMetadataData:
    """Construit les options publiques depuis les lignes admissibles."""
    rows = _admissible_rows(data)

    return FilterMetadataData(
        provinces=_options(rows["province"]),
        cultures=_options(rows["culture_analyse"]),
        campagnes=_options(rows["campagne"], campaign_order=True),
        types_environnement=_options(
            rows["type_environnement"],
            include_missing=True,
        ),
        modes_irrigation=_options(
            rows["mode_irrigation"],
            include_missing=True,
        ),
        units=ProductionUnitsData(),
    )


def _allowed_filter_values(data: pd.DataFrame, column: str) -> set[str]:
    rows = _admissible_rows(data)
    series = rows[column]

    allowed_values = {str(value) for value in series.dropna().unique()}
    if series.isna().any():
        allowed_values.add(MISSING_FILTER_VALUE)

    return allowed_values


def validate_filter_values(
    data: pd.DataFrame,
    filters: ProductionFilters,
    *,
    culture_campaign: str | None,
) -> None:
    """Valide les sélections contre les options réellement disponibles."""
    for field_name, column_name in FILTER_COLUMNS.items():
        selected_values = set(getattr(filters, field_name))
        invalid_values = sorted(selected_values - _allowed_filter_values(data, column_name))

        if invalid_values:
            raise InvalidFilterValueError(
                FILTER_PUBLIC_NAMES[field_name],
                invalid_values,
            )

    if culture_campaign is not None:
        allowed_campaigns = _allowed_filter_values(data, "campagne")
        if culture_campaign not in allowed_campaigns:
            raise InvalidFilterValueError("campagne", [culture_campaign])
