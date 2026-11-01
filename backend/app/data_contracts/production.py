"""Contrat du fichier CSV de production."""

EXPECTED_COLUMNS = (
    "province",
    "famille",
    "type_environnement",
    "campagne",
    "superficie_ha",
    "production_t",
    "rendement",
    "mode_irrigation",
    "calendrier_culture",
    "annee_debut",
    "source_production",
    "qualite_production",
    "culture_analyse",
)

REQUIRED_COLUMNS = {
    "province",
    "famille",
    "campagne",
    "superficie_ha",
    "annee_debut",
    "source_production",
    "culture_analyse",
}

TEXT_COLUMNS = {
    "province",
    "famille",
    "type_environnement",
    "campagne",
    "mode_irrigation",
    "calendrier_culture",
    "source_production",
    "qualite_production",
    "culture_analyse",
}

INTEGER_COLUMNS = {"annee_debut"}
FLOAT_COLUMNS = {"superficie_ha", "production_t", "rendement"}

ALLOWED_CATEGORIES = {
    "province": {
        "agadir-ida-outanane",
        "chtouka-aït baha",
        "inezgane aït melloul",
        "taroudant",
    },
    "famille": {
        "agrumes",
        "amandier",
        "arboricultures autres",
        "bananier",
        "cereales",
        "floriculture",
        "fourrages",
        "maraichage",
        "olivier",
    },
    "type_environnement": {"plein champ", "sous serre"},
    "mode_irrigation": {"bour", "irrigue"},
    "calendrier_culture": {"primeurs", "saison"},
    "source_production": {
        "dataset initial",
        "hcp",
        "hcp/ormva",
        "hcp - annuaire statistique maroc 2023",
    },
    "qualite_production": {
        "total_hcp_valide",
        "zero_confirme_hcp",
        "zero_non_confirme",
        # Ce drapeau reste reconnu pour permettre son exclusion en phase 2.2.
        "conflit_sources_a_exclure",
    },
    "culture_analyse": {
        "amandier",
        "arboricultures autres",
        "autres",
        "bananier",
        "bersim/mais fourager",
        "ble dur",
        "ble tendre",
        "clementine",
        "floriculture",
        "luzerne",
        "mais grain",
        "maroc late",
        "navel",
        "olivier",
        "orge",
        "pasteque",
        "poivron",
        "pomme de terre",
        "tomate",
    },
}

MIN_START_YEAR = 2010
MAX_START_YEAR = 2021
YIELD_TOLERANCE = 1e-6
