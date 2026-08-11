"""
Seed the destinations database from a JSON file copied into the container.

The original monolith loaded destinations from data/pois.json. This script
recreates the same catalogue in the destinations_db PostgreSQL database.
"""
import os
import json
import time

from app.database import init_db, DestinationsSessionLocal
from app import destination_repository

SEED_FILE = os.environ.get("SEED_FILE", "data/pois.json")

# Tags aligned with the RecommendationService scoring model (preferences +
# occasion profiles). Each destination keeps its category-specific tags so
# that "plage", "marché", "musée"… recommendations actually differ.
CATEGORY_TAGS = {
    "bar": ["nightlife", "food", "amis", "sortie"],
    "restaurant": ["food", "culture"],
    "park": ["nature", "wellness", "adventure", "forêt"],
    "attraction": ["culture", "nature", "adventure"],
    "mall": ["shopping", "food", "culture"],
    "beach": ["plage", "détente", "nature", "coucher"],
    "market": ["marché", "artisanat", "culture", "local"],
    "event": ["culture", "musique", "soirée", "amis"],
    "excursion": ["excursion", "aventure", "nature"],
    "museum": ["musée", "culture", "histoire"],
    "history": ["histoire", "culture", "patrimoine"],
    "sport": ["sport", "amis"],
}
PRICE_COSTS = {"budget": 35, "moderate": 75, "luxury": 150}


def _load_pois(path: str) -> list:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as fh:
        raw = json.load(fh)
    return raw.get("pois", [])


def seed() -> int:
    db = DestinationsSessionLocal()
    try:
        existing = destination_repository.get_all(db)
        if existing:
            return len(existing)

        count = 0
        for poi in _load_pois(SEED_FILE):
            cat = poi.get("category", "").lower()
            tags = CATEGORY_TAGS.get(cat, ["culture"])
            price = poi.get("price_level", "budget").lower()
            cost = PRICE_COSTS.get(price, 50)
            dest = {
                "id": poi.get("id"),
                "name": poi.get("name_fr") or poi.get("name", ""),
                "name_en": poi.get("name", "") or poi.get("name_fr", ""),
                "name_fr": poi.get("name_fr", "") or poi.get("name", ""),
                "original_name": poi.get("name", ""),
                "country": poi.get("country", "Gabon"),
                "continent": "Afrique",
                # All seeded POIs are in Libreville / the Estuaire region, so
                # default the city to Libreville when the source omits it.
                "city": poi.get("city") or "Libreville",
                "description": poi.get("description_fr") or poi.get("description", ""),
                "description_en": poi.get("description", ""),
                "description_fr": poi.get("description_fr", "") or poi.get("description", ""),
                "tags": tags,
                "avg_cost_per_day": cost,
                "image": poi.get("image_url") or "g1.jpg",
                "rating": poi.get("rating", 4.0),
                "reviews_count": poi.get("reviews_count", 0),
                "category": cat,
                "location": poi.get("location", {}),
                "opening_hours": poi.get("opening_hours", ""),
                "phone": poi.get("phone", ""),
                "website": poi.get("website", ""),
            }
            destination_repository.add_destination(db, dest)
            count += 1
        return count
    finally:
        db.close()


def run_with_retry():
    for attempt in range(30):
        try:
            init_db()
            count = seed()
            print(f"[seed] loaded {count} destinations")
            return
        except Exception as exc:  # pragma: no cover
            print(f"[seed] retry {attempt}: {exc}")
            time.sleep(2)
