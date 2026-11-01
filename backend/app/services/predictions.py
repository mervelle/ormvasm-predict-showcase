from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd

from app.data_contracts.territory import culture_label
from app.data_contracts.territory_geo import TERRITORY_BY_SLUG
from app.ml.m5 import (
    M5Artifact,
    M5ArtifactError,
    predict_m5,
    supported_family_culture_pairs,
    supported_provinces,
)
from app.data_contracts.territory import culture_label, family_label



CULTURE_KEY_SEPARATOR = "::"
CONFLICT_FLAG = "conflit_sources_a_exclure"
PUBLIC_MODEL_FEATURES = ("province", "culture", "superficie_ha")
MODEL_LIMITATIONS = (
    "Estimation ponctuelle fondée sur les rendements historiques observés.",
    "Les conditions climatiques futures ne sont pas utilisées par ce modèle.",
    "Aucun intervalle d'incertitude n'est disponible dans cette version.",
    "Le résultat ne constitue pas une recommandation agronomique.",
)


class PredictionInputError(ValueError):
    """Signale une valeur métier incompatible avec le contrat public M5."""

    def __init__(self, code: str, field: str, message: str) -> None:
        self.code = code
        self.field = field
        self.message = message
        super().__init__(message)


@dataclass(frozen=True)
class PredictionScenario:
    province: str
    province_label: str
    culture: str
    culture_label: str
    famille: str
    culture_analyse: str
    superficie_ha: float
    campagne: str


@dataclass(frozen=True)
class PredictionValue:
    production_t: float
    implicit_yield_t_ha: float
    estimate_type: str = "point"


@dataclass(frozen=True)
class PredictionHistoryPoint:
    campagne: str
    annee_debut: int
    production_t: float | None
    rows_used: int
    missing_production: int


@dataclass(frozen=True)
class PredictionHistoryReference:
    campagne: str
    annee_debut: int
    production_t: float


@dataclass(frozen=True)
class PredictionHistory:
    has_data: bool
    series: list[PredictionHistoryPoint]
    latest: PredictionHistoryReference | None
    mean_production_t: float | None
    minimum: PredictionHistoryReference | None
    maximum: PredictionHistoryReference | None


@dataclass(frozen=True)
class PredictionModelInfo:
    name: str
    technical_name: str
    version: str
    training_start_campaign: str
    training_end_campaign: str
    target: str
    target_unit: str
    features: list[str]
    uses_climate: bool
    has_prediction_interval: bool
    has_shap_explanation: bool
    limitations: list[str]


@dataclass(frozen=True)
class PredictionData:
    has_prediction: bool
    scenario: PredictionScenario
    prediction: PredictionValue
    history: PredictionHistory
    model: PredictionModelInfo


def make_culture_key(famille: str, culture_analyse: str) -> str:
    return f"{famille.strip().lower()}{CULTURE_KEY_SEPARATOR}{culture_analyse.strip().lower()}"


def parse_culture_key(culture_key: str) -> tuple[str, str]:
    normalized = culture_key.strip().lower()
    parts = normalized.split(CULTURE_KEY_SEPARATOR)
    if len(parts) != 2 or not all(parts):
        raise PredictionInputError(
            code="invalid_culture",
            field="culture",
            message="La culture sélectionnée n'est pas valide pour le modèle.",
        )
    return parts[0], parts[1]


def _validate_scenario(
    artifact: M5Artifact,
    *,
    province: str,
    culture_key: str,
    superficie_ha: float,
) -> tuple[str, str, str, float]:
    province_value = province.strip().lower()
    family, culture = parse_culture_key(culture_key)
    area = float(superficie_ha)

    if not math.isfinite(area) or area <= 0:
        raise PredictionInputError(
            code="invalid_superficie",
            field="superficie_ha",
            message="La superficie doit être un nombre fini strictement positif.",
        )

    if province_value not in supported_provinces(artifact):
        raise PredictionInputError(
            code="unknown_province",
            field="province",
            message="La province sélectionnée n'est pas supportée par le modèle.",
        )

    if (family, culture) not in supported_family_culture_pairs(artifact):
        raise PredictionInputError(
            code="unknown_culture",
            field="culture",
            message="La culture sélectionnée n'est pas supportée par le modèle.",
        )

    if province_value not in TERRITORY_BY_SLUG:
        raise M5ArtifactError(
            "Une province supportée par M5 est absente du contrat territorial."
        )

    return province_value, family, culture, area


def _known_production_sum(values: pd.Series) -> float | None:
    total = values.sum(min_count=1)
    return None if pd.isna(total) else float(total)


def _history_rows(
    production_data: pd.DataFrame,
    *,
    province: str,
    famille: str,
    culture_analyse: str,
) -> pd.DataFrame:
    required = {
        "province",
        "famille",
        "culture_analyse",
        "campagne",
        "annee_debut",
        "production_t",
    }
    missing = sorted(required - set(production_data.columns))
    if missing:
        raise ValueError(
            "Colonnes de production manquantes pour l'historique : "
            + ", ".join(missing)
        )

    rows = production_data.copy()
    if "qualite_production" in rows.columns:
        rows = rows[
            ~rows["qualite_production"]
            .astype(str)
            .str.strip()
            .eq(CONFLICT_FLAG)
        ].copy()

    mask = (
        rows["province"].astype(str).str.strip().str.lower().eq(province)
        & rows["famille"].astype(str).str.strip().str.lower().eq(famille)
        & rows["culture_analyse"].astype(str).str.strip().str.lower().eq(culture_analyse)
    )
    return rows.loc[mask].copy()


def _build_history(
    production_data: pd.DataFrame,
    *,
    province: str,
    famille: str,
    culture_analyse: str,
) -> PredictionHistory:
    rows = _history_rows(
        production_data,
        province=province,
        famille=famille,
        culture_analyse=culture_analyse,
    )

    if rows.empty:
        return PredictionHistory(
            has_data=False,
            series=[],
            latest=None,
            mean_production_t=None,
            minimum=None,
            maximum=None,
        )

    points: list[PredictionHistoryPoint] = []
    grouped = rows.groupby(["annee_debut", "campagne"], sort=False, dropna=False)
    for (annee_debut, campagne), group in grouped:
        production = _known_production_sum(group["production_t"])
        points.append(
            PredictionHistoryPoint(
                campagne=str(campagne),
                annee_debut=int(annee_debut),
                production_t=production,
                rows_used=int(group["production_t"].notna().sum()),
                missing_production=int(group["production_t"].isna().sum()),
            )
        )

    points.sort(key=lambda point: point.annee_debut)
    known = [point for point in points if point.production_t is not None]

    if not known:
        return PredictionHistory(
            has_data=False,
            series=points,
            latest=None,
            mean_production_t=None,
            minimum=None,
            maximum=None,
        )

    def reference(point: PredictionHistoryPoint) -> PredictionHistoryReference:
        assert point.production_t is not None
        return PredictionHistoryReference(
            campagne=point.campagne,
            annee_debut=point.annee_debut,
            production_t=point.production_t,
        )

    latest_point = max(known, key=lambda point: point.annee_debut)
    minimum_point = min(known, key=lambda point: (point.production_t, point.annee_debut))
    maximum_point = max(known, key=lambda point: (point.production_t, -point.annee_debut))
    mean = sum(float(point.production_t) for point in known) / len(known)

    return PredictionHistory(
        has_data=True,
        series=points,
        latest=reference(latest_point),
        mean_production_t=float(mean),
        minimum=reference(minimum_point),
        maximum=reference(maximum_point),
    )


def _manifest_string(artifact: M5Artifact, key: str) -> str:
    value = artifact.manifest.get(key)
    if not isinstance(value, str) or not value.strip():
        raise M5ArtifactError(f"Métadonnée M5 absente ou invalide : {key}.")
    return value


def _manifest_bool(artifact: M5Artifact, key: str) -> bool:
    value = artifact.manifest.get(key)
    if not isinstance(value, bool):
        raise M5ArtifactError(f"Métadonnée M5 absente ou invalide : {key}.")
    return value


def _build_model_info(artifact: M5Artifact) -> PredictionModelInfo:
    return PredictionModelInfo(
        name=_manifest_string(artifact, "display_name"),
        technical_name=_manifest_string(artifact, "model_name"),
        version=_manifest_string(artifact, "model_version"),
        training_start_campaign=_manifest_string(artifact, "training_start_campaign"),
        training_end_campaign=_manifest_string(artifact, "training_end_campaign"),
        target=_manifest_string(artifact, "target"),
        target_unit=_manifest_string(artifact, "target_unit"),
        features=list(PUBLIC_MODEL_FEATURES),
        uses_climate=_manifest_bool(artifact, "uses_climate"),
        has_prediction_interval=_manifest_bool(artifact, "has_prediction_interval"),
        has_shap_explanation=_manifest_bool(artifact, "has_shap_explanation"),
        limitations=list(MODEL_LIMITATIONS),
    )


def build_prediction(
    production_data: pd.DataFrame,
    artifact: M5Artifact,
    *,
    province: str,
    culture_key: str,
    superficie_ha: float,
    campagne: str,
) -> PredictionData:
    """Construit l'estimation M5 et son contexte historique sans réentraînement."""
    province_value, family, culture, area = _validate_scenario(
        artifact,
        province=province,
        culture_key=culture_key,
        superficie_ha=superficie_ha,
    )

    raw_prediction = predict_m5(
        artifact,
        famille=family,
        culture_analyse=culture,
        province=province_value,
        superficie_ha=area,
    )
    production = float(raw_prediction["production_predite_t"])
    implicit_yield = production / area

    if not math.isfinite(production) or production < 0:
        raise M5ArtifactError("La production prédite par M5 est invalide.")
    if not math.isfinite(implicit_yield) or implicit_yield < 0:
        raise M5ArtifactError("Le rendement implicite calculé est invalide.")

    history = _build_history(
        production_data,
        province=province_value,
        famille=family,
        culture_analyse=culture,
    )
    territory = TERRITORY_BY_SLUG[province_value]
    public_culture_key = make_culture_key(family, culture)

    return PredictionData(
        has_prediction=True,
        scenario=PredictionScenario(
            province=province_value,
            province_label=territory.province_label,
            culture=public_culture_key,
            culture_label=culture_label(family, culture),
            famille=family,
            culture_analyse=culture,
            superficie_ha=area,
            campagne=campagne,
        ),
        prediction=PredictionValue(
            production_t=production,
            implicit_yield_t_ha=implicit_yield,
        ),
        history=history,
        model=_build_model_info(artifact),
    )

def build_prediction_options(artifact: M5Artifact) -> dict[str, object]:
    """Expose les clés cultures exactes acceptées par l'artefact M5."""
    cultures = [
        {
            "value": f"{famille}::{culture}",
            "label": culture_label(famille, culture),
            "famille": famille,
            "famille_label": family_label(famille),
        }
        for famille, culture in sorted(
            supported_family_culture_pairs(artifact)
        )
    ]

    return {"cultures": cultures}

