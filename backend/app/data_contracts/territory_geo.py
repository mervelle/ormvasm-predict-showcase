from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TerritoryDefinition:
    province_slug: str
    province_label: str
    administrative_type: str


TERRITORIES = (
    TerritoryDefinition(
        province_slug="agadir-ida-outanane",
        province_label="Agadir-Ida-Outanane",
        administrative_type="préfecture",
    ),
    TerritoryDefinition(
        province_slug="inezgane aït melloul",
        province_label="Inezgane Aït Melloul",
        administrative_type="préfecture",
    ),
    TerritoryDefinition(
        province_slug="chtouka-aït baha",
        province_label="Chtouka-Aït Baha",
        administrative_type="province",
    ),
    TerritoryDefinition(
        province_slug="taroudant",
        province_label="Taroudant",
        administrative_type="province",
    ),
)

TERRITORY_BY_SLUG = {item.province_slug: item for item in TERRITORIES}
TERRITORY_SLUGS = tuple(item.province_slug for item in TERRITORIES)

# Alias explicites de préparation. Il n'existe aucune correspondance floue au runtime.
SOURCE_NAME_ALIASES = {
    "agadir-ida-outanane": (
        "Agadir Ida-Outanane",
        "Agadir Ida Ou Tanane",
        "Agadir-Ida-Ou-Tanane",
        "Agadir-Ida ou Tanane",
        "Agadir-Ida-Outanane",
        "Agadir Ida-Outanane Prefecture",
    ),
    "inezgane aït melloul": (
        "Inezgane Ait Melloul",
        "Inezgane-Ait Melloul",
        "Inezgane Aït Melloul",
        "Inezgane-Aït Melloul",
        "Inezgane-Ait Melloul Prefecture",
    ),
    "chtouka-aït baha": (
        "Chtouka Ait Baha",
        "Chtouka-Ait Baha",
        "Chtouka Aït Baha",
        "Chtouka-Aït Baha",
        "Chtouka-Ait Baha Province",
    ),
    "taroudant": (
        "Taroudant",
        "Taroudannt",
        "Taroudant Province",
    ),
}

# Emprise volontairement large pour détecter un mauvais pays ou un CRS projeté.
PLAUSIBLE_SOUS_MASSA_BOUNDS = {
    "min_lon": -11.5,
    "max_lon": -5.0,
    "min_lat": 27.0,
    "max_lat": 32.5,
}
