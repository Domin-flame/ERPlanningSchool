"""
API Gateway entry point (FastAPI).

Run:
    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import (
    USER_SERVICE_URL,
    ITINERARY_SERVICE_URL,
    RECOMMENDATION_SERVICE_URL,
)
from app.proxy import proxy_request

app = FastAPI(
    title="GlobeTrotter API Gateway",
    description="Single entry point for all GlobeTrotter microservices. "
                "Routes requests to the appropriate service.",
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


@app.get("/", include_in_schema=False)
def home():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Health"])
async def health():
    """Report the health of the gateway and all upstream services."""
    services = {
        "gateway": {"status": "ok"},
        "user-service": await _check(USER_SERVICE_URL),
        "itinerary-service": await _check(ITINERARY_SERVICE_URL),
        "recommendation-service": await _check(RECOMMENDATION_SERVICE_URL),
    }
    return {"status": "ok", "services": services}


@app.get("/rabbitmq", tags=["Health"])
async def rabbitmq_status():
    """Report whether services report RabbitMQ connectivity."""
    user = await _check(USER_SERVICE_URL)
    itin = await _check(ITINERARY_SERVICE_URL)
    rec = await _check(RECOMMENDATION_SERVICE_URL)
    return {
        "rabbitmq": "configured",
        "user_service": user,
        "itinerary_service": itin,
        "recommendation_service": rec,
    }


async def _check(base_url: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{base_url}/health")
            if resp.status_code == 200:
                return {"status": "ok", "detail": resp.json()}
            return {"status": f"error:{resp.status_code}"}
    except Exception as exc:
        return {"status": "unreachable", "detail": str(exc)}


# ---------------------------------------------------------------------------
# Catch-all proxy routes
# ---------------------------------------------------------------------------

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
               include_in_schema=False)
async def catch_all(path: str, request: Request):
    return await proxy_request(request)
