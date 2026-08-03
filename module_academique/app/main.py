from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import academic_structure, calendar, infrastructure, offerings, people, records


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Academic Module Service",
    description="Service de gestion du module académique (structure, calendrier, personnes, "
    "infrastructure, offres de cours, dossiers pédagogiques).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(academic_structure.router)
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
