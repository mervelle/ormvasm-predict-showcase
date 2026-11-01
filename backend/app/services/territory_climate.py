from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from app.data_contracts.territory_geo import TERRITORY_SLUGS


@dataclass(frozen=True)
class TerritoryClimateSummary:
    temperature_mean_c: float | None
    precipitation_median_mm: float | None
    et0_median_mm: float | None
    deficit_median_mm: float | None
    wind_mean_m_s: float | None
    campaigns_available: int
    campaigns_expected: int
    observations_available: int
    observations_expected: int
    territories_available: int
    territories_expected: int
    start_campaign: str | None
    end_campaign: str | None
    source: str
    scope_note: str


def _mean(rows: pd.DataFrame, column: str) -> float | None:
    values = rows[column].dropna()
    return None if values.empty else float(values.mean())


def _median(rows: pd.DataFrame, column: str) -> float | None:
    values = rows[column].dropna()
    return None if values.empty else float(values.median())


def _campaign_period(rows: pd.DataFrame) -> tuple[str | None, str | None]:
    campaigns = (
        rows.loc[:, ["annee_debut", "campagne"]]
        .drop_duplicates()
        .sort_values(["annee_debut", "campagne"], kind="stable")
    )
    if campaigns.empty:
        return None, None
    return str(campaigns.iloc[0]["campagne"]), str(campaigns.iloc[-1]["campagne"])


def build_territory_climate_summary(
    climate_data: pd.DataFrame,
    *,
    province_slug: str | None = None,
) -> TerritoryClimateSummary:
    """Construit le résumé climatique sans dupliquer les lignes agricoles."""
    if province_slug is not None and province_slug not in TERRITORY_SLUGS:
        raise ValueError("Territoire climatique inconnu.")

    campaign_axis = (
        climate_data.loc[:, ["annee_debut", "campagne"]]
        .drop_duplicates()
        .sort_values(["annee_debut", "campagne"], kind="stable")
    )
    campaigns_expected = len(campaign_axis)

    if province_slug is None:
        rows = climate_data
        territories_expected = len(TERRITORY_SLUGS)
        scope_note = (
            "Synthèse descriptive des quatre territoires du projet, calculée sur "
            "les observations province + campagne disponibles, sans pondération "
            "spatiale de l'ensemble de la région administrative."
        )
    else:
        rows = climate_data.loc[climate_data["province"].eq(province_slug)]
        territories_expected = 1
        scope_note = (
            "Synthèse descriptive des campagnes climatiques disponibles pour le "
            "territoire sélectionné."
        )

    campaigns_available = int(rows["campagne"].nunique()) if not rows.empty else 0
    territories_available = int(rows["province"].nunique()) if not rows.empty else 0
    start_campaign, end_campaign = _campaign_period(rows)

    return TerritoryClimateSummary(
        temperature_mean_c=_mean(rows, "temperature_moyenne_campagne_c"),
        precipitation_median_mm=_median(
            rows,
            "precipitation_totale_campagne_mm",
        ),
        et0_median_mm=_median(rows, "et0_totale_campagne_mm"),
        deficit_median_mm=_median(rows, "deficit_climatique_campagne_mm"),
        wind_mean_m_s=_mean(rows, "vitesse_vent_10m_moyenne_campagne_ms"),
        campaigns_available=campaigns_available,
        campaigns_expected=campaigns_expected,
        observations_available=len(rows),
        observations_expected=campaigns_expected * territories_expected,
        territories_available=territories_available,
        territories_expected=territories_expected,
        start_campaign=start_campaign,
        end_campaign=end_campaign,
        source="ERA5-Land",
        scope_note=scope_note,
    )
