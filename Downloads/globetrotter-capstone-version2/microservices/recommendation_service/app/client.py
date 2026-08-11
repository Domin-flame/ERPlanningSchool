"""
RecommendationService HTTP client.

Synchronous REST communication with UserService and ItineraryService.
"""
import httpx

from app.config import USER_SERVICE_URL, ITINERARY_SERVICE_URL


def get_user_preferences(username: str) -> list:
    """Fetch a user's preference tags from UserService."""
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{USER_SERVICE_URL}/internal/users/{username}")
            if resp.status_code == 200:
                data = resp.json()
                return data.get("preferences", [])
    except httpx.HTTPError as exc:
        print(f"[client] get_user_preferences error: {exc}")
    return []


def get_all_destinations() -> list:
    """Fetch the full destination catalogue from ItineraryService."""
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{ITINERARY_SERVICE_URL}/destinations/internal")
            if resp.status_code == 200:
                return resp.json()
    except httpx.HTTPError as exc:
        print(f"[client] get_all_destinations error: {exc}")
    return []


def get_user_itineraries(username: str) -> list:
    """Fetch a user's itineraries from ItineraryService (used for scoring)."""
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{ITINERARY_SERVICE_URL}/itineraries")
            if resp.status_code == 200:
                return resp.json()
    except httpx.HTTPError as exc:
        print(f"[client] get_user_itineraries error: {exc}")
    return []
