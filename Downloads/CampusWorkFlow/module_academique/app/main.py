import os
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.routers import academic_structure, analytics, calendar, infrastructure, offerings, people, records


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema and tables are managed by Alembic migrations.
    # Optionally run migrations at startup if DB_AUTO_INIT is enabled.
    try:
        if os.getenv("DB_AUTO_INIT", "false").lower() == "true":
            # Attempt to run alembic upgrade head; ignore failures to avoid
            # blocking startup in environments without migrations.
            subprocess.run(
                ["alembic", "-c", "migrations/alembic.ini", "upgrade", "head"],
                check=False,
            )
    except Exception:
        pass
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


@app.get("/", tags=["Health"])
def root():
    return {"status": "Academic Module Service opérationnel"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
