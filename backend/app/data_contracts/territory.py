from __future__ import annotations

FAMILY_LABELS = {
    "agrumes": "Agrumes",
    "amandier": "Amandier",
    "arboricultures autres": "Autres arboricultures",
    "bananier": "Bananier",
    "cereales": "Céréales",
    "floriculture": "Floriculture",
    "fourrages": "Fourrages",
    "maraichage": "Maraîchage",
    "olivier": "Olivier",
}

CULTURE_LABELS = {
    "amandier": "Amandier",
    "arboricultures autres": "Autres arboricultures",
    "autres": "Autres",
    "bananier": "Bananier",
    "bersim/mais fourager": "Bersim / maïs fourrager",
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

PRACTICE_LABELS = {
    "plein champ": "Plein champ",
    "sous serre": "Sous serre",
    "irrigue": "Irrigué",
    "bour": "Bour",
}


def family_label(value: str) -> str:
    return FAMILY_LABELS.get(value, value.capitalize())


def culture_label(family: str, culture: str) -> str:
    label = CULTURE_LABELS.get(culture, culture.capitalize())
    if culture == "autres":
        return f"{label} — {family_label(family)}"
    return label


def practice_label(value: str) -> str:
    return PRACTICE_LABELS.get(value, value.capitalize())
