"""
UserService entry point (FastAPI).

Run:
    uvicorn app.main:app --host 0.0.0.0 --port 8001
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, visited, favorite_notes

app = FastAPI(
    title="GlobeTrotter User Service",
    description="Manages users, authentication, profiles, preferences, "
                "visited destinations and favorite notes. Owns the 'users' data.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(visited.router)
app.include_router(favorite_notes.router)


@app.on_event("startup")
def on_startup():
    # Give PostgreSQL a moment to be ready in docker-compose.
    import time
    for attempt in range(30):
        try:
            init_db()
            break
        except Exception as exc:  # pragma: no cover
            print(f"[startup] db not ready (attempt {attempt}): {exc}")
            time.sleep(2)


@app.get("/health", tags=["Health"])
def health():
    return {"service": "user-service", "status": "ok"}
