"""
API Gateway proxying logic.

Acts as a single entry point: inspects the request path and forwards it to
the appropriate microservice, preserving method, query params, headers and
body. Responses are streamed back to the client.
"""
import httpx

from app.config import (
    USER_SERVICE_URL,
    ITINERARY_SERVICE_URL,
    RECOMMENDATION_SERVICE_URL,
)

# Route table: a list of (prefix, target_base_url) tuples.
# The first matching prefix wins.
ROUTES = [
    # User domain
    ("/register", USER_SERVICE_URL),
    ("/login", USER_SERVICE_URL),
    ("/admin/login", USER_SERVICE_URL),
    ("/users", USER_SERVICE_URL),
    ("/visited", USER_SERVICE_URL),
    ("/favorite-notes", USER_SERVICE_URL),

    # Recommendation domain
    ("/recommendations", RECOMMENDATION_SERVICE_URL),

    # Itinerary domain (fallback to itinerary service for everything else)
    ("", ITINERARY_SERVICE_URL),
]


async def proxy_request(request):
    """Route *request* to the correct upstream service and return the response."""
    path = request.url.path
    query = request.url.query  # str, may be ""

    target_base = None
    for prefix, base in ROUTES:
        if path.startswith(prefix):
            target_base = base
            break

    assert target_base, "No route matched"

    target_url = f"{target_base}{path}"
    if query:
        target_url = f"{target_url}?{query}"

    # Forward relevant headers (drop host to avoid confusion).
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.request(
            request.method,
            target_url,
            headers=headers,
            content=body,
        )

    from fastapi.responses import Response
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=resp.headers,
        media_type=resp.headers.get("content-type", "application/json"),
    )
