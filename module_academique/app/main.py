import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine, DATABASE_SCHEMA
from app.routers import academic_structure, analytics, calendar, infrastructure, offerings, people, records, student_portal


@asynccontextmanager
async def lifespan(app: FastAPI):
    if engine.dialect.name == "postgresql" and DATABASE_SCHEMA:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DATABASE_SCHEMA};"))
                conn.commit()
        except Exception as e:
            print(f"Warning creating schema {DATABASE_SCHEMA}: {e}")
    Base.metadata.create_all(bind=engine)
    if os.getenv("DB_AUTO_SEED", "false").lower() == "true":
        # Données de démonstration (idempotent : ne fait rien si la base
        # contient déjà des facultés). Sans elles, aucun module, semestre,
        # campus ni enseignant n'existe : impossible de créer un cours ou
        # d'ouvrir une offre depuis l'interface.
        try:
            from scripts.seed_academic import run as seed_academic

            seed_academic()
        except Exception as e:  # pragma: no cover - ne bloque pas le démarrage
            print(f"Warning seeding academic demo data: {e}")
    yield


app = FastAPI(
    title="Academic Module Service",
    description=(
        "Service de gestion du module académique (structure, calendrier, personnes, "
        "infrastructure, offres de cours, dossiers pédagogiques)."
    ),
    version="1.0.0",
    lifespan=lifespan,
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(academic_structure.router)
app.include_router(analytics.router)
app.include_router(calendar.router)
app.include_router(people.router)
app.include_router(infrastructure.router)
app.include_router(offerings.router)
app.include_router(records.router)
app.include_router(student_portal.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "Academic Module Service opérationnel"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
