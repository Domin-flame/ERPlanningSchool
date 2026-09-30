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
