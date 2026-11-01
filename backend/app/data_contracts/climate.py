from dataclasses import dataclass

from app.data_contracts.production import EXPECTED_COLUMNS as PRODUCTION_EXPECTED_COLUMNS

CLIMATE_KEY_COLUMNS = ("province", "campagne")

CLIMATE_INTEGER_COLUMNS = (
    "annee_debut",
    "nombre_jours_campagne",
    "nombre_jours_pluvieux_1mm_campagne",
    "nombre_jours_secs_1mm_campagne",
    "duree_max_sequence_seche_jours",
    "nombre_mois_humides_campagne",
    "nombre_mois_intermediaires_campagne",
    "nombre_mois_secs_campagne",
    "nombre_mois_pluvieux_campagne",
    "nombre_jours_tmax_ge_35c",
    "nombre_jours_tmax_ge_40c",
    "duree_max_sequence_chaleur_35c_jours",
    "nombre_episodes_chaleur_3j_35c",
)

CLIMATE_FLOAT_COLUMNS = (
    "latitude",
    "longitude",
    "temperature_moyenne_campagne_c",
    "temperature_max_moyenne_campagne_c",
    "temperature_min_moyenne_campagne_c",
    "temperature_max_absolue_campagne_c",
    "temperature_min_absolue_campagne_c",
    "precipitation_totale_campagne_mm",
    "precipitation_moyenne_journaliere_campagne_mm",
    "rayonnement_total_campagne_mj_m2",
    "rayonnement_moyen_journalier_campagne_mj_m2_jour",
    "humidite_moyenne_campagne_pct",
    "vitesse_vent_10m_moyenne_campagne_ms",
    "vitesse_vent_2m_moyenne_campagne_ms",
    "et0_totale_campagne_mm",
    "et0_moyenne_journaliere_campagne_mm_jour",
    "et0_max_journaliere_campagne_mm_jour",
    "deficit_climatique_campagne_mm",
    "ratio_pluie_et0_campagne",
    "deficit_climatique_mensuel_max_mm",
    "deficit_climatique_mensuel_moyen_mm",
    "stress_thermique_cumule_35c_deg_jour",
)

CLIMATE_MEASURE_COLUMNS = tuple(
    column
    for column in (*CLIMATE_INTEGER_COLUMNS, *CLIMATE_FLOAT_COLUMNS)
    if column != "annee_debut"
)

CLIMATE_TABLE_COLUMNS = (
    *CLIMATE_KEY_COLUMNS,
    "annee_debut",
    *CLIMATE_MEASURE_COLUMNS,
)

FUSED_EXPECTED_COLUMNS = frozenset(PRODUCTION_EXPECTED_COLUMNS).union(
    CLIMATE_MEASURE_COLUMNS
)

FUSED_REQUIRED_COLUMNS = frozenset(CLIMATE_TABLE_COLUMNS)

NON_NEGATIVE_CLIMATE_COLUMNS = (
    "precipitation_totale_campagne_mm",
    "precipitation_moyenne_journaliere_campagne_mm",
    "nombre_jours_pluvieux_1mm_campagne",
    "nombre_jours_secs_1mm_campagne",
    "duree_max_sequence_seche_jours",
    "nombre_mois_humides_campagne",
    "nombre_mois_intermediaires_campagne",
    "nombre_mois_secs_campagne",
    "nombre_mois_pluvieux_campagne",
    "rayonnement_total_campagne_mj_m2",
    "rayonnement_moyen_journalier_campagne_mj_m2_jour",
    "vitesse_vent_10m_moyenne_campagne_ms",
    "vitesse_vent_2m_moyenne_campagne_ms",
    "et0_totale_campagne_mm",
    "et0_moyenne_journaliere_campagne_mm_jour",
    "et0_max_journaliere_campagne_mm_jour",
    "deficit_climatique_campagne_mm",
    "ratio_pluie_et0_campagne",
    "deficit_climatique_mensuel_max_mm",
    "deficit_climatique_mensuel_moyen_mm",
    "nombre_jours_tmax_ge_35c",
    "nombre_jours_tmax_ge_40c",
    "duree_max_sequence_chaleur_35c_jours",
    "nombre_episodes_chaleur_3j_35c",
    "stress_thermique_cumule_35c_deg_jour",
)

ALLOWED_CLIMATE_PROVINCES = frozenset(
    {
        "agadir-ida-outanane",
        "chtouka-aït baha",
        "inezgane aït melloul",
        "taroudant",
    }
)

FORMULA_RTOL = 1e-9
FORMULA_ATOL = 1e-9


@dataclass(frozen=True)
class ClimateFactorDefinition:
    column: str
    label: str
    unit: str
    group: str
    description: str


CLIMATE_FACTORS = {
    "precipitation": ClimateFactorDefinition(
        column="precipitation_totale_campagne_mm",
        label="Précipitations totales",
        unit="mm",
        group="Eau",
        description="Cumul des précipitations pendant la campagne.",
    ),
    "et0": ClimateFactorDefinition(
        column="et0_totale_campagne_mm",
        label="ET0 totale",
        unit="mm",
        group="Eau",
        description="Cumul de l'évapotranspiration de référence pendant la campagne.",
    ),
    "deficit_climatique": ClimateFactorDefinition(
        column="deficit_climatique_campagne_mm",
        label="Déficit climatique",
        unit="mm",
        group="Eau",
        description="Différence entre l'ET0 totale et les précipitations totales.",
    ),
    "ratio_pluie_et0": ClimateFactorDefinition(
        column="ratio_pluie_et0_campagne",
        label="Ratio pluie/ET0",
        unit="ratio",
        group="Eau",
        description="Rapport entre les précipitations et l'ET0 de la campagne.",
    ),
    "jours_secs": ClimateFactorDefinition(
        column="nombre_jours_secs_1mm_campagne",
        label="Jours secs",
        unit="jours",
        group="Eau",
        description="Nombre de jours dont les précipitations sont inférieures à 1 mm.",
    ),
    "sequence_seche_max": ClimateFactorDefinition(
        column="duree_max_sequence_seche_jours",
        label="Séquence sèche maximale",
        unit="jours",
        group="Eau",
        description="Durée de la plus longue séquence de jours secs.",
    ),
    "temperature_moyenne": ClimateFactorDefinition(
        column="temperature_moyenne_campagne_c",
        label="Température moyenne",
        unit="°C",
        group="Température",
        description="Température moyenne observée pendant la campagne.",
    ),
    "temperature_max_absolue": ClimateFactorDefinition(
        column="temperature_max_absolue_campagne_c",
        label="Température maximale absolue",
        unit="°C",
        group="Température",
        description="Température maximale observée pendant la campagne.",
    ),
    "jours_tmax_ge_35": ClimateFactorDefinition(
        column="nombre_jours_tmax_ge_35c",
        label="Jours avec Tmax ≥ 35 °C",
        unit="jours",
        group="Température",
        description="Nombre de jours dont la température maximale atteint 35 °C.",
    ),
    "stress_thermique_cumule": ClimateFactorDefinition(
        column="stress_thermique_cumule_35c_deg_jour",
        label="Stress thermique cumulé",
        unit="°C·jour",
        group="Température",
        description="Cumul des degrés au-dessus du seuil de 35 °C.",
    ),
    "humidite": ClimateFactorDefinition(
        column="humidite_moyenne_campagne_pct",
        label="Humidité moyenne",
        unit="%",
        group="Atmosphère",
        description="Humidité relative moyenne pendant la campagne.",
    ),
    "rayonnement": ClimateFactorDefinition(
        column="rayonnement_total_campagne_mj_m2",
        label="Rayonnement total",
        unit="MJ/m²",
        group="Atmosphère",
        description="Rayonnement solaire cumulé pendant la campagne.",
    ),
    "vent_moyen_10m": ClimateFactorDefinition(
        column="vitesse_vent_10m_moyenne_campagne_ms",
        label="Vent moyen à 10 m",
        unit="m/s",
        group="Atmosphère",
        description="Vitesse moyenne du vent mesurée ou estimée à 10 mètres.",
    ),
}
