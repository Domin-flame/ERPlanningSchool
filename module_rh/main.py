from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (nécessaire pour enregistrer les tables sur Base.metadata)
from app.database import Base, engine
from app.routers import employees, leave, attendance, payroll

# Crée les tables si elles n'existent pas encore (pour un démarrage rapide en
# dev/démo). En "vrai" projet on utiliserait Alembic pour les migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HR & Admin Service",
    description=(
        "Microservice RH pour l'ERP scolaire : gestion des employés, "
        "paie (CNPS/PAYE), congés et pointage par QR code. "
        "Ce service vérifie les JWT émis par le service Auth (Week 1) "
        "et sera exposé au frontend via l'API Gateway (Week 3) "
        "sous le préfixe /api/v1/hr/*."
    ),
    version="1.0.0",
)

# CORS : en prod, remplace "*" par l'URL exacte du Gateway/frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(leave.router)
app.include_router(attendance.router)
app.include_router(payroll.router)


@app.get("/health", tags=["System"])
def health_check():
    """Utilisé par l'API Gateway / docker-compose pour vérifier que le
    service est en vie avant de lui router du trafic."""
    return {"status": "ok", "service": "hr-service"}
