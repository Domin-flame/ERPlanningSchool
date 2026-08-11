"""
RecommendationService entry point (FastAPI).

Run:
    uvicorn app.main:app --host 0.0.0.0 --port 8003
"""
import asyncio

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from app import service
from app.consumer import consumer, USER_PREFERENCES, DESTINATIONS_CACHE
from app.schemas import RecommendationOut, ConsumerStatus
from shared.jwt_utils import HTTPBearer, decode_token

app = FastAPI(
    title="GlobeTrotter Recommendation Service",
    description="Generates personalised travel recommendations. Reads data "
                "from UserService (preferences) and ItineraryService "
                "(destinations) via synchronous REST and asynchronous "
                "RabbitMQ events.",
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

bearer = HTTPBearer(auto_error=False)


@app.on_event("startup")
async def on_startup():
    asyncio.create_task(start_consumer_task())


async def start_consumer_task():
    from app.consumer import start_consumer
    await start_consumer()


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


@app.get("/recommendations", response_model=list[RecommendationOut],
         summary="Get personalised destination recommendations")
def get_recommendations(limit: int = 5, occasion: str = "",
                        city: str = "", credentials=Depends(bearer)):
    """Return personalised recommendations.

    - `limit`    : number of results (default 5).
    - `occasion` : travel context (romantique, famille, amis, solo,
                   affaires, aventure, detente, decouverte). Adds a
                   weighted bonus on top of the user's preferences.
    - `city`     : default "libreville". Pass "all" to disable the
                   Libreville-only focus.
    """
    username = _current_user(credentials)
    if limit < 1:
        raise HTTPException(status_code=400, detail="limit must be >= 1")
    return service.get_recommendations(
        username, limit, occasion=occasion or None, city=city or None
    )


@app.get("/internal/consumer-status", response_model=ConsumerStatus,
         summary="[Internal] RabbitMQ consumer status")
def consumer_status():
    return ConsumerStatus(
        connected=consumer._connection is not None,
        user_cache_size=len(USER_PREFERENCES),
        destinations_cached=len(DESTINATIONS_CACHE),
    )


@app.get("/health", tags=["Health"])
def health():
    return {"service": "recommendation-service", "status": "ok"}


@app.on_event("shutdown")
async def shutdown():
    if consumer._connection:
        await consumer._connection.close()
