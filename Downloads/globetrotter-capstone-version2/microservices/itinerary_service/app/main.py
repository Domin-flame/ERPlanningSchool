"""
ItineraryService entry point (FastAPI).

Run:
    uvicorn app.main:app --host 0.0.0.0 --port 8002
"""
import os
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import itineraries, destinations, reviews, proposals, bookings

app = FastAPI(
    title="GlobeTrotter Itinerary Service",
    description="Manages itineraries, schedules, bookings, reviews, "
                "destination proposals and the destinations catalogue. "
                "Owns the 'itineraries' and 'destinations' data.",
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

app.include_router(itineraries.router)
app.include_router(destinations.router)
app.include_router(reviews.router)
app.include_router(proposals.router)
app.include_router(bookings.router)


@app.on_event("startup")
def on_startup():
    for attempt in range(30):
        try:
            init_db()
            break
        except Exception as exc:  # pragma: no cover
            print(f"[startup] db not ready (attempt {attempt}): {exc}")
            time.sleep(2)
    # Seed destinations from copied JSON
    try:
        from app.seed_destinations import run_with_retry
        run_with_retry()
    except Exception as exc:  # pragma: no cover
        print(f"[startup] seed warning: {exc}")


@app.get("/health", tags=["Health"])
def health():
    return {"service": "itinerary-service", "status": "ok"}
