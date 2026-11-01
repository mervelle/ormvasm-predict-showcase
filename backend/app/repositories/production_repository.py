from __future__ import annotations

import math
from pathlib import Path

import pandas as pd

from app.data_contracts.production import (
    ALLOWED_CATEGORIES,
    EXPECTED_COLUMNS,
    FLOAT_COLUMNS,
    INTEGER_COLUMNS,
    MAX_START_YEAR,
    MIN_START_YEAR,
    REQUIRED_COLUMNS,
    TEXT_COLUMNS,
    YIELD_TOLERANCE,
)


class DatasetValidationError(Exception):
    """Erreur levée lorsque le dataset de production viole le contrat."""


class ProductionRepository:
    """Conserve en mémoire une version validée du dataset de production."""

    def __init__(self, dataframe: pd.DataFrame) -> None:
        self._dataframe = dataframe.copy(deep=True)

    @classmethod
    def from_csv(cls, path: Path) -> ProductionRepository:
        """Charge et valide le fichier de production."""
        dataframe = cls._read_csv(path)
        cls._validate_columns(dataframe)
        dataframe = cls._convert_types(dataframe)
        cls._validate_data(dataframe)
        return cls(dataframe)

    @staticmethod
    def _read_csv(path: Path) -> pd.DataFrame:
        try:
            dataframe = pd.read_csv(path)
        except FileNotFoundError as error:
            raise DatasetValidationError("Fichier de production introuvable.") from error
        except (OSError, UnicodeDecodeError, pd.errors.ParserError) as error:
            raise DatasetValidationError("Lecture du fichier de production impossible.") from error

        if dataframe.empty:
            raise DatasetValidationError("Le fichier de production est vide.")

        return dataframe

    @staticmethod
    def _validate_columns(dataframe: pd.DataFrame) -> None:
        expected_columns = set(EXPECTED_COLUMNS)
        received_columns = set(dataframe.columns)
        missing_columns = expected_columns - received_columns
        unexpected_columns = received_columns - expected_columns

        if missing_columns:
            raise DatasetValidationError(
                f"Colonnes obligatoires absentes : {sorted(missing_columns)}"
            )
        if unexpected_columns:
            raise DatasetValidationError(f"Colonnes inattendues : {sorted(unexpected_columns)}")

    @staticmethod
    def _convert_types(dataframe: pd.DataFrame) -> pd.DataFrame:
        converted = dataframe.copy(deep=True)

        for column in TEXT_COLUMNS:
            converted[column] = converted[column].astype("string")

        for column in INTEGER_COLUMNS:
            try:
                converted[column] = pd.to_numeric(converted[column], errors="raise").astype("Int64")
            except (ValueError, TypeError) as error:
                raise DatasetValidationError(f"Valeur entière invalide dans {column}.") from error

        for column in FLOAT_COLUMNS:
            try:
                converted[column] = pd.to_numeric(converted[column], errors="raise").astype(
                    "Float64"
                )
            except (ValueError, TypeError) as error:
                raise DatasetValidationError(f"Valeur numérique invalide dans {column}.") from error

        return converted.loc[:, EXPECTED_COLUMNS]

    @classmethod
    def _validate_data(cls, dataframe: pd.DataFrame) -> None:
        cls._validate_required_values(dataframe)
        cls._validate_categories(dataframe)
        cls._validate_numeric_values(dataframe)
        cls._validate_campaigns(dataframe)
        cls._validate_yield(dataframe)

    @staticmethod
    def _validate_required_values(dataframe: pd.DataFrame) -> None:
        for column in REQUIRED_COLUMNS:
            if dataframe[column].isna().any():
                raise DatasetValidationError(f"Valeur manquante interdite dans {column}.")

    @staticmethod
    def _validate_categories(dataframe: pd.DataFrame) -> None:
        for column, allowed_values in ALLOWED_CATEGORIES.items():
            invalid_values = set(dataframe[column].dropna()) - allowed_values
            if invalid_values:
                raise DatasetValidationError(
                    f"Valeur interdite dans {column} : {sorted(invalid_values)}"
                )

    @staticmethod
    def _validate_numeric_values(dataframe: pd.DataFrame) -> None:
        for column in (*INTEGER_COLUMNS, *FLOAT_COLUMNS):
            known_values = dataframe[column].dropna()
            if not known_values.map(math.isfinite).all():
                raise DatasetValidationError(f"Valeur non finie interdite dans {column}.")

        if (dataframe["superficie_ha"] <= 0).any():
            raise DatasetValidationError("superficie_ha doit être strictement positive.")
        if (dataframe["production_t"].dropna() < 0).any():
            raise DatasetValidationError(
                "production_t doit être supérieure ou égale à zéro lorsqu'elle est connue."
            )
        if (dataframe["rendement"].dropna() < 0).any():
            raise DatasetValidationError(
                "rendement doit être supérieur ou égal à zéro lorsqu'il est connu."
            )

    @staticmethod
    def _validate_campaigns(dataframe: pd.DataFrame) -> None:
        valid_format = dataframe["campagne"].str.fullmatch(r"\d{4}/\d{4}")
        if not valid_format.all():
            raise DatasetValidationError("Format de campagne invalide.")

        campaign_parts = dataframe["campagne"].str.split("/", expand=True)
        campaign_start = pd.to_numeric(campaign_parts[0], errors="raise").astype("Int64")
        campaign_end = pd.to_numeric(campaign_parts[1], errors="raise").astype("Int64")

        invalid_campaign = (
            (campaign_start != dataframe["annee_debut"])
            | (campaign_end != campaign_start + 1)
            | ~campaign_start.between(MIN_START_YEAR, MAX_START_YEAR)
        )
        if invalid_campaign.any():
            raise DatasetValidationError("campagne et annee_debut sont incohérentes.")

    @staticmethod
    def _validate_yield(dataframe: pd.DataFrame) -> None:
        inconsistent_missing_values = (
            dataframe["production_t"].isna() != dataframe["rendement"].isna()
        )
        if inconsistent_missing_values.any():
            raise DatasetValidationError(
                "production_t et rendement doivent être renseignés ou manquants ensemble."
            )

        known_rows = dataframe.loc[dataframe["production_t"].notna()]
        expected_yield = known_rows["production_t"] / known_rows["superficie_ha"]
        yield_difference = (known_rows["rendement"] - expected_yield).abs()

        # La tolérance évite un rejet causé uniquement par l'arrondi flottant.
        if (yield_difference > YIELD_TOLERANCE).any():
            raise DatasetValidationError(
                "rendement est incohérent avec production_t / superficie_ha."
            )

        # Une production égale à zéro reste connue et n'est jamais convertie en null.

    def get_all(self) -> pd.DataFrame:
        """Retourne une copie afin de protéger les données partagées."""
        return self._dataframe.copy(deep=True)
