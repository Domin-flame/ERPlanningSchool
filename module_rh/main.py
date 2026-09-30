import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models  # noqa: F401 — enregistre les tables dans Base.metadata
from app.config import DATABASE_SCHEMA
from app.database import Base, engine
from app.routers import employees, leave, attendance, payroll

# Crée le schéma et les tables si inexistants
if engine.dialect.name == "postgresql" and DATABASE_SCHEMA:
    try:
        with engine.connect() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DATABASE_SCHEMA};"))
            conn.commit()
    except Exception as e:
        print(f"Warning creating schema {DATABASE_SCHEMA}: {e}")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HR & Admin Service",
    description=(
        "Microservice RH pour l'ERP scolaire : gestion des employés, "
        "paie (CNPS/PAYE), congés et pointage par QR code. "
        "Exposé via l'API Gateway sous le préfixe /api/v1/hr/*."
    ),
    version="1.0.0",
)

# CORS : n'accepte que les requêtes du gateway (ou localhost en dev).
_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://gateway:3000,http://localhost:5173",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(leave.router)
app.include_router(attendance.router)
app.include_router(payroll.router)


@app.get("/health", tags=["System"])
def health_check():
    """Utilisé par l'API Gateway / docker-compose pour vérifier que le service est prêt."""
    return {"status": "ok", "service": "hr-service"}
