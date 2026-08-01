import os

# ----------------------------------------------------------------------
# Base de données (à faire correspondre avec le service partagé Week 2)
# ----------------------------------------------------------------------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://erp_user:erp_pass@localhost:5432/erp_school",
)

# ----------------------------------------------------------------------
# JWT — DOIT être identique au secret utilisé par le service Auth (Week 1)
# sinon la vérification des tokens échouera. Demande la valeur exacte
# à la personne qui a fait le service Auth et mets-la dans le .env.
# ----------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_SAME_AS_AUTH_SERVICE")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# ----------------------------------------------------------------------
# Taux CNPS / PAYE (Cameroun) — VALEURS INDICATIVES POUR LE PROJET
# ----------------------------------------------------------------------
# ⚠️ Important pour l'évaluation : les taux fiscaux/sociaux réels changent
# et varient selon la catégorie de risque professionnel. Pour un projet
# académique, garde ces taux comme CONSTANTES CONFIGURABLES (comme ici)
# et explique à l'examinateur que le calcul est paramétrable — c'est
# exactement ce qu'un vrai système de paie doit faire. Vérifie les taux
# officiels actuels auprès de la CNPS / DGI si tu veux les rendre exacts.

# CNPS - part salariale (retenue sur le salaire de l'employé)
CNPS_EMPLOYEE_PENSION_RATE = 0.042  # 4.2%

# CNPS - part patronale (payée par l'employeur, n'affecte pas le net employé)
CNPS_EMPLOYER_PENSION_RATE = 0.042      # 4.2%
CNPS_EMPLOYER_FAMILY_ALLOWANCE_RATE = 0.07   # 7% allocations familiales
CNPS_EMPLOYER_WORK_INJURY_RATE = 0.0175      # 1.75% (risque faible, ajustable)

# Plafond mensuel soumis à cotisation CNPS (XAF) — à vérifier/ajuster
CNPS_MONTHLY_CEILING = 750_000

# CFC (Crédit Foncier du Cameroun)
CFC_EMPLOYEE_RATE = 0.01   # 1% salarié
CFC_EMPLOYER_RATE = 0.015  # 1.5% employeur

# FNE (Fonds National de l'Emploi) - part patronale uniquement
FNE_EMPLOYER_RATE = 0.01  # 1%

# CAC (Centimes Additionnels Communaux) = 10% de l'IRPP
CAC_RATE = 0.10

# Barème IRPP mensuel progressif (simplifié pour le projet).
# Format: (plafond_tranche, taux). None = pas de plafond (dernière tranche).
IRPP_BRACKETS = [
    (166_667, 0.10),   # jusqu'à 2 000 000 XAF/an -> 10%
    (250_000, 0.15),   # tranche suivante -> 15%
    (416_667, 0.25),   # tranche suivante -> 25%
    (None, 0.35),       # au-delà -> 35%
]
