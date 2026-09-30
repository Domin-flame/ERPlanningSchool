"""
Configuration centralisée du service RH : connexion DB, secret JWT (partagé
avec le service Auth) et taux CNPS / CFC / FNE / IRPP utilisés par le moteur
de paie (app/services/payroll_calculator.py).

ATTENTION : les taux ci-dessous sont des valeurs SIMPLIFIÉES à but
pédagogique / démo pour ce projet scolaire. Ils ne doivent pas être utilisés
tels quels pour un vrai calcul de paie en production — se référer aux textes
CNPS / DGI (Cameroun) en vigueur.
"""
import os

# --- Base de données ---------------------------------------------------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://campus_user:campus_pass@localhost:5432/hr_db",
)
DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA", "public")

# --- JWT (même secret/algorithme que module_authentification) ----------
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"

# --- Taux CNPS (retraite / prestations familiales / risques pro) -------
CNPS_EMPLOYEE_PENSION_RATE = 0.042
CNPS_EMPLOYER_PENSION_RATE = 0.042
CNPS_EMPLOYER_FAMILY_ALLOWANCE_RATE = 0.07
CNPS_EMPLOYER_WORK_INJURY_RATE = 0.02
CNPS_MONTHLY_CEILING = 750_000  # XAF

# --- CFC (Crédit Foncier du Cameroun) et FNE (Fonds National de l'Emploi)
CFC_EMPLOYEE_RATE = 0.01
CFC_EMPLOYER_RATE = 0.015
FNE_EMPLOYER_RATE = 0.01

# --- IRPP (impôt progressif sur le revenu) et CAC (centimes additionnels)
CAC_RATE = 0.10

# Barème progressif mensuel simplifié : (plafond_tranche, taux).
# Le dernier palier (ceiling=None) s'applique sans plafond.
IRPP_BRACKETS = [
    (166_667, 0.10),
    (250_000, 0.15),
    (416_667, 0.25),
    (None, 0.35),
]
