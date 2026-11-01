from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
from pandas.errors import EmptyDataError, ParserError

from app.data_contracts.climate import (
    ALLOWED_CLIMATE_PROVINCES,
    CLIMATE_FLOAT_COLUMNS,
    CLIMATE_INTEGER_COLUMNS,
    CLIMATE_KEY_COLUMNS,
    CLIMATE_MEASURE_COLUMNS,
    CLIMATE_TABLE_COLUMNS,
    FORMULA_ATOL,
    FORMULA_RTOL,
    FUSED_EXPECTED_COLUMNS,
    FUSED_REQUIRED_COLUMNS,
    NON_NEGATIVE_CLIMATE_COLUMNS,
)


class ClimateDatasetValidationError(ValueError):
    """Signale que le contrat climatique du fichier fusionné n'est pas respecté."""


def _format_columns(columns: set[str]) -> str:
    return ", ".join(sorted(columns))


def _validate_columns(frame: pd.DataFrame) -> None:
    actual = frozenset(frame.columns)
    missing = set(FUSED_EXPECTED_COLUMNS - actual)
    unexpected = set(actual - FUSED_EXPECTED_COLUMNS)

    errors: list[str] = []
    if missing:
        errors.append(f"colonnes manquantes: {_format_columns(missing)}")
    if unexpected:
        errors.append(f"colonnes inattendues: {_format_columns(unexpected)}")

    if errors:
        raise ClimateDatasetValidationError("; ".join(errors))


def _validate_required_values(frame: pd.DataFrame) -> None:
    missing_counts = frame[list(FUSED_REQUIRED_COLUMNS)].isna().sum()
    invalid = missing_counts[missing_counts.gt(0)]
    if not invalid.empty:
        details = ", ".join(f"{column}={count}" for column, count in invalid.items())
        raise ClimateDatasetValidationError(
            f"valeurs climatiques obligatoires manquantes: {details}"
        )


def _convert_numeric_columns(frame: pd.DataFrame) -> None:
    for column in CLIMATE_FLOAT_COLUMNS:
        try:
            values = pd.to_numeric(frame[column], errors="raise").astype("float64")
        except (TypeError, ValueError) as error:
            raise ClimateDatasetValidationError(
                f"la colonne {column} doit contenir des nombres"
            ) from error

        if not np.isfinite(values.to_numpy()).all():
            raise ClimateDatasetValidationError(
                f"la colonne {column} contient une valeur non finie"
            )
        frame[column] = values

    for column in CLIMATE_INTEGER_COLUMNS:
        try:
            values = pd.to_numeric(frame[column], errors="raise")
        except (TypeError, ValueError) as error:
            raise ClimateDatasetValidationError(
                f"la colonne {column} doit contenir des entiers"
            ) from error

        if not np.isfinite(values.to_numpy(dtype="float64")).all():
            raise ClimateDatasetValidationError(
                f"la colonne {column} contient une valeur non finie"
            )
        if not values.mod(1).eq(0).all():
            raise ClimateDatasetValidationError(
                f"la colonne {column} doit contenir des entiers"
            )
        frame[column] = values.astype("int64")


def _validate_keys(frame: pd.DataFrame) -> None:
    for column in CLIMATE_KEY_COLUMNS:
        frame[column] = frame[column].astype("string").str.strip().str.lower()

    invalid_campaigns = ~frame["campagne"].str.fullmatch(r"\d{4}/\d{4}")
    if invalid_campaigns.any():
        raise ClimateDatasetValidationError(
            "campagne doit respecter le format AAAA/AAAA"
        )

    expected_end_year = frame["annee_debut"] + 1
    campaign_start = frame["campagne"].str[:4].astype("int64")
    campaign_end = frame["campagne"].str[5:].astype("int64")
    if not campaign_start.eq(frame["annee_debut"]).all() or not campaign_end.eq(
        expected_end_year
    ).all():
        raise ClimateDatasetValidationError(
            "campagne et annee_debut ne sont pas cohérentes"
        )

    unknown_provinces = set(frame["province"].unique()) - set(
        ALLOWED_CLIMATE_PROVINCES
    )
    if unknown_provinces:
        raise ClimateDatasetValidationError(
            f"provinces inconnues: {_format_columns(unknown_provinces)}"
        )


def _require(condition: pd.Series, message: str) -> None:
    if not condition.all():
        raise ClimateDatasetValidationError(message)


def _require_close(actual: pd.Series, expected: pd.Series, message: str) -> None:
    if not np.isclose(
        actual.to_numpy(dtype="float64"),
        expected.to_numpy(dtype="float64"),
        rtol=FORMULA_RTOL,
        atol=FORMULA_ATOL,
    ).all():
        raise ClimateDatasetValidationError(message)


def _validate_physical_consistency(frame: pd.DataFrame) -> None:
    negative = frame[list(NON_NEGATIVE_CLIMATE_COLUMNS)].lt(0)
    invalid_columns = set(negative.columns[negative.any()])
    if invalid_columns:
        raise ClimateDatasetValidationError(
            "valeurs négatives interdites: " + _format_columns(invalid_columns)
        )

    _require(
        frame["latitude"].between(-90, 90),
        "latitude doit être comprise entre -90 et 90",
    )
    _require(
        frame["longitude"].between(-180, 180),
        "longitude doit être comprise entre -180 et 180",
    )
    _require(
        frame["nombre_jours_campagne"].isin((365, 366)),
        "nombre_jours_campagne doit valoir 365 ou 366",
    )
    _require(
        frame["humidite_moyenne_campagne_pct"].between(0, 100),
        "humidite_moyenne_campagne_pct doit être comprise entre 0 et 100",
    )
    _require(
        frame["temperature_max_moyenne_campagne_c"].ge(
            frame["temperature_moyenne_campagne_c"]
        ),
        "la température maximale moyenne doit être supérieure à la moyenne",
    )
    _require(
        frame["temperature_moyenne_campagne_c"].ge(
            frame["temperature_min_moyenne_campagne_c"]
        ),
        "la température moyenne doit être supérieure à la minimale moyenne",
    )
    _require(
        frame["temperature_max_absolue_campagne_c"].ge(
            frame["temperature_max_moyenne_campagne_c"]
        ),
        "la température maximale absolue est incohérente",
    )
    _require(
        frame["temperature_min_absolue_campagne_c"].le(
            frame["temperature_min_moyenne_campagne_c"]
        ),
        "la température minimale absolue est incohérente",
    )
    _require(
        frame["nombre_jours_pluvieux_1mm_campagne"]
        + frame["nombre_jours_secs_1mm_campagne"]
        == frame["nombre_jours_campagne"],
        "les jours pluvieux et secs ne couvrent pas toute la campagne",
    )
    _require(
        frame["nombre_mois_humides_campagne"]
        + frame["nombre_mois_intermediaires_campagne"]
        + frame["nombre_mois_secs_campagne"]
        == 12,
        "les mois humides, intermédiaires et secs ne totalisent pas 12",
    )
    _require(
        frame["nombre_jours_tmax_ge_40c"].le(
            frame["nombre_jours_tmax_ge_35c"]
        ),
        "les jours avec Tmax ≥ 40 °C dépassent ceux avec Tmax ≥ 35 °C",
    )

    days = frame["nombre_jours_campagne"]
    _require_close(
        frame["precipitation_moyenne_journaliere_campagne_mm"],
        frame["precipitation_totale_campagne_mm"] / days,
        "la moyenne journalière des précipitations est incohérente",
    )
    _require_close(
        frame["rayonnement_moyen_journalier_campagne_mj_m2_jour"],
        frame["rayonnement_total_campagne_mj_m2"] / days,
        "la moyenne journalière du rayonnement est incohérente",
    )
    _require_close(
        frame["et0_moyenne_journaliere_campagne_mm_jour"],
        frame["et0_totale_campagne_mm"] / days,
        "la moyenne journalière de l'ET0 est incohérente",
    )
    _require_close(
        frame["deficit_climatique_campagne_mm"],
        frame["et0_totale_campagne_mm"]
        - frame["precipitation_totale_campagne_mm"],
        "le déficit climatique ne correspond pas à ET0 - précipitations",
    )
    _require(
        frame["et0_totale_campagne_mm"].gt(0),
        "et0_totale_campagne_mm doit être strictement positive",
    )
    _require_close(
        frame["ratio_pluie_et0_campagne"],
        frame["precipitation_totale_campagne_mm"]
        / frame["et0_totale_campagne_mm"],
        "le ratio pluie/ET0 est incohérent",
    )


def _deduplicate_climate_rows(frame: pd.DataFrame) -> pd.DataFrame:
    grouped_counts = frame.groupby(
        list(CLIMATE_KEY_COLUMNS), sort=False, dropna=False
    )[list(CLIMATE_MEASURE_COLUMNS)].nunique(dropna=False)

    conflicting_keys = grouped_counts.gt(1).any(axis="columns")
    if conflicting_keys.any():
        examples = [
            f"{province} | {campagne}"
            for province, campagne in grouped_counts.index[conflicting_keys][:5]
        ]
        raise ClimateDatasetValidationError(
            "valeurs climatiques contradictoires pour: " + "; ".join(examples)
        )

    climate = frame.loc[:, CLIMATE_TABLE_COLUMNS].drop_duplicates(
        subset=list(CLIMATE_KEY_COLUMNS), keep="first"
    )
    return climate.sort_values(
        ["annee_debut", "province"], kind="stable", ignore_index=True
    )


@dataclass(frozen=True)
class ClimateRepository:
    _data: pd.DataFrame

    @classmethod
    def from_csv(cls, path: Path) -> ClimateRepository:
        try:
            frame = pd.read_csv(path)
        except FileNotFoundError as error:
            raise ClimateDatasetValidationError(
                f"fichier climatique introuvable: {path}"
            ) from error
        except (EmptyDataError, ParserError, UnicodeDecodeError, OSError) as error:
            raise ClimateDatasetValidationError(
                "impossible de lire le fichier climatique fusionné"
            ) from error

        return cls.from_dataframe(frame)

    @classmethod
    def from_dataframe(cls, frame: pd.DataFrame) -> ClimateRepository:
        working = frame.copy(deep=True)
        _validate_columns(working)
        _validate_required_values(working)
        _convert_numeric_columns(working)
        _validate_keys(working)
        _validate_physical_consistency(working)
        climate = _deduplicate_climate_rows(working)
        return cls(_data=climate)

    @property
    def data(self) -> pd.DataFrame:
        return self._data.copy(deep=True)
