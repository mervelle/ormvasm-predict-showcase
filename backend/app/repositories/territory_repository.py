from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.data_contracts.territory_geo import TERRITORY_SLUGS


class TerritoryGeoRepositoryError(ValueError):
    """Signale un GeoJSON territorial ou ses métadonnées incompatibles."""


def _load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except OSError as error:
        raise TerritoryGeoRepositoryError(
            f"Impossible de lire le fichier territorial: {path.name}"
        ) from error
    except json.JSONDecodeError as error:
        raise TerritoryGeoRepositoryError(
            f"JSON territorial invalide: {path.name}"
        ) from error

    if not isinstance(payload, dict):
        raise TerritoryGeoRepositoryError(
            f"Le fichier {path.name} doit contenir un objet JSON."
        )
    return payload


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _validate_geojson(payload: dict[str, Any]) -> None:
    if payload.get("type") != "FeatureCollection":
        raise TerritoryGeoRepositoryError(
            "Le GeoJSON territorial doit être une FeatureCollection."
        )

    features = payload.get("features")
    if not isinstance(features, list) or len(features) != len(TERRITORY_SLUGS):
        raise TerritoryGeoRepositoryError(
            "Le GeoJSON doit contenir exactement les quatre territoires du projet."
        )

    slugs: list[str] = []
    for feature in features:
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            raise TerritoryGeoRepositoryError("Feature GeoJSON invalide.")

        properties = feature.get("properties")
        geometry = feature.get("geometry")
        if not isinstance(properties, dict) or not isinstance(geometry, dict):
            raise TerritoryGeoRepositoryError(
                "Chaque feature doit contenir properties et geometry."
            )

        slug = properties.get("province_slug")
        if not isinstance(slug, str):
            raise TerritoryGeoRepositoryError("province_slug est obligatoire.")
        slugs.append(slug)

        if geometry.get("type") not in {"Polygon", "MultiPolygon"}:
            raise TerritoryGeoRepositoryError(
                f"Géométrie non supportée pour {slug}."
            )

    if tuple(slugs) != TERRITORY_SLUGS:
        if set(slugs) != set(TERRITORY_SLUGS):
            raise TerritoryGeoRepositoryError(
                "Les slugs GeoJSON ne correspondent pas au contrat territorial."
            )


def _validate_metadata(
    metadata: dict[str, Any],
    geojson_path: Path,
) -> None:
    required = {
        "dataset_title",
        "source_organization",
        "source_url",
        "license_name",
        "license_url",
        "source_version",
        "sha256_derived",
        "modifications",
    }
    missing = required - set(metadata)
    if missing:
        raise TerritoryGeoRepositoryError(
            "Métadonnées géographiques incomplètes: " + ", ".join(sorted(missing))
        )

    expected_hash = metadata.get("sha256_derived")
    if not isinstance(expected_hash, str) or expected_hash != _sha256(geojson_path):
        raise TerritoryGeoRepositoryError(
            "Le hash du GeoJSON ne correspond pas aux métadonnées validées."
        )


@dataclass(frozen=True)
class TerritoryGeoRepository:
    _geojson: dict[str, Any]
    _metadata: dict[str, Any]

    @classmethod
    def from_files(
        cls,
        geojson_path: Path,
        metadata_path: Path,
    ) -> "TerritoryGeoRepository":
        geojson = _load_json(geojson_path)
        metadata = _load_json(metadata_path)
        _validate_geojson(geojson)
        _validate_metadata(metadata, geojson_path)
        return cls(_geojson=geojson, _metadata=metadata)

    @property
    def geojson(self) -> dict[str, Any]:
        return deepcopy(self._geojson)

    @property
    def metadata(self) -> dict[str, Any]:
        return deepcopy(self._metadata)
