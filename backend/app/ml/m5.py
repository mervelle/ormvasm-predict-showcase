from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Any
import json
import math

import pandas as pd

PRIMARY_FILENAME = "rendements_famille_culture_province.csv"
CULTURE_PROVINCE_FILENAME = "rendements_culture_province.csv"
CULTURE_FILENAME = "rendements_culture.csv"
CONFIG_FILENAME = "model_config.json"
MANIFEST_FILENAME = "manifest.json"
REFERENCE_FILENAME = "reference_prediction.json"

RUNTIME_FILENAMES = (
    PRIMARY_FILENAME,
    CULTURE_PROVINCE_FILENAME,
    CULTURE_FILENAME,
    CONFIG_FILENAME,
)

PRIMARY_COLUMNS = {
    "famille",
    "culture_analyse",
    "province",
    "rendement_primary",
    "n_campagnes",
}
CULTURE_PROVINCE_COLUMNS = {
    "culture_analyse",
    "province",
    "rendement_culture_province",
    "n_campagnes",
}
CULTURE_COLUMNS = {
    "culture_analyse",
    "rendement_culture",
    "n_campagnes",
}


class M5ArtifactError(RuntimeError):
    """Artefact M5 absent, altéré ou incompatible."""


@dataclass(frozen=True)
class M5Artifact:
    model_dir: Path
    manifest: dict[str, Any]
    config: dict[str, Any]
    primary: pd.DataFrame
    culture_province: pd.DataFrame
    culture: pd.DataFrame


def _normalize_category(value: str) -> str:
    return str(value).strip().lower()


def _sha256_file(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as stream:
            value = json.load(stream)
    except (OSError, json.JSONDecodeError) as exc:
        raise M5ArtifactError(f"Fichier JSON M5 illisible : {path.name}") from exc

    if not isinstance(value, dict):
        raise M5ArtifactError(f"Le fichier {path.name} doit contenir un objet JSON.")
    return value


def _read_csv(path: Path, required_columns: set[str]) -> pd.DataFrame:
    try:
        frame = pd.read_csv(path)
    except (OSError, pd.errors.ParserError) as exc:
        raise M5ArtifactError(f"Fichier CSV M5 illisible : {path.name}") from exc

    missing = sorted(required_columns - set(frame.columns))
    if missing:
        raise M5ArtifactError(
            f"Colonnes manquantes dans {path.name} : {', '.join(missing)}"
        )
    return frame


def _verify_runtime_hashes(model_dir: Path, manifest: dict[str, Any]) -> None:
    expected_hashes = manifest.get("files_sha256")
    if not isinstance(expected_hashes, dict):
        raise M5ArtifactError("manifest.json ne contient pas files_sha256.")

    for filename in RUNTIME_FILENAMES:
        path = model_dir / filename
        if not path.is_file():
            raise M5ArtifactError(f"Artefact M5 incomplet : {filename} absent.")

        expected = expected_hashes.get(filename)
        if not isinstance(expected, str) or len(expected) != 64:
            raise M5ArtifactError(
                f"Empreinte SHA-256 absente ou invalide pour {filename}."
            )

        actual = _sha256_file(path)
        if actual != expected:
            raise M5ArtifactError(
                f"Empreinte SHA-256 incorrecte pour {filename}."
            )


def _validate_metadata(manifest: dict[str, Any], config: dict[str, Any]) -> None:
    expected_name = "weighted_historical_yield"
    if manifest.get("model_name") != expected_name:
        raise M5ArtifactError("model_name incompatible dans manifest.json.")
    if config.get("model_name") != expected_name:
        raise M5ArtifactError("model_name incompatible dans model_config.json.")

    if manifest.get("target") != "production_t":
        raise M5ArtifactError("La cible figée doit être production_t.")
    if manifest.get("target_unit") != "t":
        raise M5ArtifactError("L'unité figée de la cible doit être la tonne.")
    if manifest.get("uses_climate") is not False:
        raise M5ArtifactError("Le baseline M5 figé ne doit pas utiliser le climat.")

    if manifest.get("fallback_order") != config.get("fallback_order"):
        raise M5ArtifactError("Ordre de fallback incohérent entre manifest et config.")
    if manifest.get("min_history_campaigns") != config.get("min_history_campaigns"):
        raise M5ArtifactError("Seuil historique incohérent entre manifest et config.")

    manifest_global = manifest.get("global_yield_t_ha")
    config_global = config.get("global_yield_t_ha")
    if not isinstance(manifest_global, (int, float)) or not isinstance(
        config_global, (int, float)
    ):
        raise M5ArtifactError("Rendement global absent des métadonnées M5.")
    if not math.isclose(float(manifest_global), float(config_global), rel_tol=0, abs_tol=1e-12):
        raise M5ArtifactError("Rendement global incohérent entre manifest et config.")


def load_m5_artifact(model_dir: Path) -> M5Artifact:
    model_dir = Path(model_dir)
    manifest_path = model_dir / MANIFEST_FILENAME
    if not manifest_path.is_file():
        raise M5ArtifactError("Artefact M5 incomplet : manifest.json absent.")

    manifest = _read_json(manifest_path)
    _verify_runtime_hashes(model_dir, manifest)

    config = _read_json(model_dir / CONFIG_FILENAME)
    _validate_metadata(manifest, config)

    primary = _read_csv(model_dir / PRIMARY_FILENAME, PRIMARY_COLUMNS)
    culture_province = _read_csv(
        model_dir / CULTURE_PROVINCE_FILENAME,
        CULTURE_PROVINCE_COLUMNS,
    )
    culture = _read_csv(model_dir / CULTURE_FILENAME, CULTURE_COLUMNS)

    return M5Artifact(
        model_dir=model_dir,
        manifest=manifest,
        config=config,
        primary=primary,
        culture_province=culture_province,
        culture=culture,
    )


def _lookup_single_yield(
    frame: pd.DataFrame,
    filters: dict[str, str],
    yield_column: str,
) -> float | None:
    mask = pd.Series(True, index=frame.index)
    for column, value in filters.items():
        mask &= frame[column].astype(str).str.strip().str.lower().eq(value)

    rows = frame.loc[mask, yield_column]
    if rows.empty:
        return None
    if len(rows) > 1:
        raise M5ArtifactError(
            f"Artefact ambigu : plusieurs lignes correspondent à {filters}."
        )

    value = rows.iloc[0]
    if pd.isna(value):
        return None

    value = float(value)
    if not math.isfinite(value) or value < 0:
        raise M5ArtifactError(
            f"Rendement invalide dans l'artefact pour {filters}."
        )
    return value


def predict_m5(
    artifact: M5Artifact,
    *,
    famille: str,
    culture_analyse: str,
    province: str,
    superficie_ha: float,
) -> dict[str, float | str]:
    area = float(superficie_ha)
    if not math.isfinite(area) or area <= 0:
        raise ValueError("superficie_ha doit être un nombre fini strictement positif.")

    family = _normalize_category(famille)
    culture = _normalize_category(culture_analyse)
    province_value = _normalize_category(province)

    primary = _lookup_single_yield(
        artifact.primary,
        {
            "famille": family,
            "culture_analyse": culture,
            "province": province_value,
        },
        "rendement_primary",
    )
    if primary is not None:
        source = "famille_culture_province"
        selected_yield = primary
    else:
        culture_province = _lookup_single_yield(
            artifact.culture_province,
            {
                "culture_analyse": culture,
                "province": province_value,
            },
            "rendement_culture_province",
        )
        if culture_province is not None:
            source = "culture_province"
            selected_yield = culture_province
        else:
            culture_only = _lookup_single_yield(
                artifact.culture,
                {"culture_analyse": culture},
                "rendement_culture",
            )
            if culture_only is not None:
                source = "culture"
                selected_yield = culture_only
            else:
                source = "global"
                selected_yield = float(artifact.config["global_yield_t_ha"])

    production = area * selected_yield
    if not math.isfinite(production) or production < 0:
        raise M5ArtifactError("La prédiction M5 calculée est invalide.")

    return {
        "production_predite_t": production,
        "rendement_utilise_t_ha": selected_yield,
        "source_rendement": source,
    }


def supported_provinces(artifact: M5Artifact) -> tuple[str, ...]:
    values = artifact.manifest.get("supported_provinces", [])
    return tuple(str(value) for value in values)


def supported_family_culture_pairs(
    artifact: M5Artifact,
) -> tuple[tuple[str, str], ...]:
    raw_pairs = artifact.manifest.get("supported_family_culture_pairs", [])
    result: list[tuple[str, str]] = []
    for item in raw_pairs:
        if not isinstance(item, dict):
            raise M5ArtifactError("supported_family_culture_pairs est invalide.")
        family = item.get("famille")
        culture = item.get("culture_analyse")
        if not isinstance(family, str) or not isinstance(culture, str):
            raise M5ArtifactError("Paire famille/culture invalide dans le manifest.")
        result.append((family, culture))
    return tuple(result)

