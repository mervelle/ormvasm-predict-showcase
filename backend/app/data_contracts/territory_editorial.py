from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Literal

from app.data_contracts.territory_geo import TERRITORY_SLUGS

SourceKind = Literal[
    "institutional_web",
    "project_dataset",
    "climate_dataset",
]
EditorialRole = Literal["paragraph", "scope"]


@dataclass(frozen=True)
class EditorialSource:
    key: str
    source_kind: SourceKind
    source_title: str
    source_organization: str
    source_url: str | None
    accessed_at: date
    scope_note: str


@dataclass(frozen=True)
class EditorialFact:
    key: str
    role: EditorialRole
    text: str
    source_keys: tuple[str, ...]


@dataclass(frozen=True)
class RegionEditorial:
    slug: str
    label: str
    covered_territory_slugs: tuple[str, ...]
    excluded_administrative_territories: tuple[str, ...]
    facts: tuple[EditorialFact, ...]
    data_source_keys: tuple[str, ...]

    @property
    def paragraph(self) -> str:
        return " ".join(
            fact.text for fact in self.facts if fact.role == "paragraph"
        )

    @property
    def scope_note(self) -> str:
        return " ".join(
            fact.text for fact in self.facts if fact.role == "scope"
        )

    @property
    def scope_label(self) -> str:
        covered = len(self.covered_territory_slugs)
        total = covered + len(self.excluded_administrative_territories)
        return f"{covered} territoires couverts sur {total}"


EDITORIAL_SOURCES = (
    EditorialSource(
        key="hcp_monographie_2025",
        source_kind="institutional_web",
        source_title="Monographie régionale de Souss Massa — Édition 2025",
        source_organization=(
            "Haut-Commissariat au Plan — Direction Régionale Souss-Massa"
        ),
        source_url="https://www.hcp.ma/region-agadir/attachment/2801621/",
        accessed_at=date(2026, 9, 6),
        scope_note=(
            "Situation géographique, relief et caractère climatique général de "
            "Souss-Massa."
        ),
    ),
    EditorialSource(
        key="hcp_presentation_region",
        source_kind="institutional_web",
        source_title="Présentation de la région de Souss Massa",
        source_organization=(
            "Haut-Commissariat au Plan — Direction Régionale Souss-Massa"
        ),
        source_url=(
            "https://www.hcp.ma/region-agadir/"
            "Presentation-de-la-region-de-Souss-Massa_a16.html"
        ),
        accessed_at=date(2026, 9, 6),
        scope_note=(
            "Organisation administrative de la région et contexte agricole des "
            "plaines, primeurs et agrumes."
        ),
    ),
    EditorialSource(
        key="production_dataset",
        source_kind="project_dataset",
        source_title="dataset_production_final_hcp_corrected.csv",
        source_organization="PIAD-Agri — dataset de production validé",
        source_url=None,
        accessed_at=date(2026, 9, 6),
        scope_note=(
            "Périmètre des quatre territoires couverts et période agricole "
            "réellement disponible dans le projet."
        ),
    ),
    EditorialSource(
        key="era5_land",
        source_kind="climate_dataset",
        source_title="ERA5-Land hourly data from 1950 to present",
        source_organization="Copernicus Climate Change Service / ECMWF",
        source_url=(
            "https://cds.climate.copernicus.eu/datasets/"
            "reanalysis-era5-land?tab=overview"
        ),
        accessed_at=date(2026, 9, 6),
        scope_note=(
            "Provenance du jeu climatique utilisé par le repository dédupliqué "
            "validé en phase 4."
        ),
    ),
)

EDITORIAL_SOURCE_BY_KEY = {
    source.key: source for source in EDITORIAL_SOURCES
}

SOUSS_MASSA_EDITORIAL = RegionEditorial(
    slug="souss-massa",
    label="Souss-Massa",
    covered_territory_slugs=TERRITORY_SLUGS,
    excluded_administrative_territories=("Tiznit", "Tata"),
    facts=(
        EditorialFact(
            key="geography_relief",
            role="paragraph",
            text=(
                "Située au centre du Maroc, la région Souss-Massa s'étend de "
                "l'océan Atlantique vers l'est et associe une vaste plaine "
                "centrale aux reliefs du Haut-Atlas et de l'Anti-Atlas."
            ),
            source_keys=("hcp_monographie_2025",),
        ),
        EditorialFact(
            key="climate_character",
            role="paragraph",
            text=(
                "Son climat est généralement semi-aride, sous influence "
                "atlantique et saharienne, avec des précipitations faibles et "
                "irrégulières."
            ),
            source_keys=("hcp_monographie_2025",),
        ),
        EditorialFact(
            key="agricultural_context",
            role="paragraph",
            text=(
                "Les terres agricoles les plus fertiles se situent notamment "
                "dans les plaines du Souss-Massa, où les primeurs et les "
                "agrumes occupent une place importante."
            ),
            source_keys=("hcp_presentation_region",),
        ),
        EditorialFact(
            key="administrative_structure",
            role="scope",
            text=(
                "Administrativement, Souss-Massa comprend deux préfectures et "
                "quatre provinces."
            ),
            source_keys=("hcp_presentation_region",),
        ),
        EditorialFact(
            key="project_scope",
            role="scope",
            text=(
                "Le périmètre de ce dashboard couvre quatre de ces six "
                "territoires : Agadir-Ida-Outanane, Inezgane Aït Melloul, "
                "Chtouka-Aït Baha et Taroudant ; Tiznit et Tata ne figurent "
                "pas dans le dataset de production du projet."
            ),
            source_keys=(
                "hcp_presentation_region",
                "production_dataset",
            ),
        ),
    ),
    data_source_keys=("production_dataset", "era5_land"),
)

PRODUCTION_PERIOD_NOTE_TEMPLATE = (
    "Période agricole affichée : {start_campaign} à {end_campaign}."
)
