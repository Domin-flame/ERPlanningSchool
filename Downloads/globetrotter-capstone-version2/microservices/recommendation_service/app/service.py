"""
RecommendationService business logic.

Personalised recommendations derived by scoring each destination against the
user's preference tags AND the travel occasion (e.g. "romantique", "famille",
"entre amis", "solo", "affaires", "aventure", "détente").

The service is deliberately focused on Libreville:
  - by default only destinations whose city matches the configured home city
    ("Libreville") are recommended;
  - a `city` query parameter is still accepted for advanced/administrative use.

Scoring model (deterministic, no external ML dependency):
    base = tag matches (user preferences)
    occasion_bonus = weighted matches between occasion descriptors and
                     destination tags / category / textual fields
    quality_bonus  = rating in [4.0, 5.0] adds a small constant
    Every destination receives a tiny epsilon score so that a user with no
    preferences still gets a well-ordered list (best rated first).
"""
from app import client
from app.consumer import USER_PREFERENCES, DESTINATIONS_CACHE

HOME_CITY = "libreville"
HOME_COUNTRY = "gabon"

# Categories that are inherently "Libreville-urban" and worth keeping even if
# a destination's city field is empty (approved proposals may lack city).
CITY_HINTS = {"libreville", "akanda", "estuaire"}

# Occasion -> (matching tags, matching categories, textual keywords)
OCCASION_PROFILES = {
    "romantique": (
        {"plage", "coucher", "front de mer", "détente"},
        {"beach", "attraction"},
        {"baie", "plage", "front de mer", "coucher", "soirée", "restaurant"},
    ),
    "famille": (
        {"plage", "nature", "culture", "parc"},
        {"beach", "park", "market", "attraction"},
        {"plage", "parc", "marché", "famille", "pique-nique", "espace"},
    ),
    "amis": (
        {"nightlife", "food", "sport", "culture"},
        {"bar", "restaurant", "attraction", "event"},
        {"soirée", "concert", "musique", "sport", "bar", "animation"},
    ),
    "solo": (
        {"culture", "promenade", "détente", "nature"},
        {"attraction", "park", "museum", "culture"},
        {"musée", "institut", "balade", "méditation", "calme", "culture"},
    ),
    "affaires": (
        {"sport", "culture", "restaurant"},
        {"attraction", "restaurant"},
        {"hôtel", "réunion", "prestigieux", "central", "restaurant"},
    ),
    "aventure": (
        {"nature", "randonnée", "excursion", "safari", "adventure"},
        {"park", "beach", "excursion"},
        {"forêt", "parc", "excursion", "sentier", "expédition", "mangrove", "safari"},
    ),
    "detente": (
        {"plage", "détente", "nature", "wellness"},
        {"beach", "park"},
        {"plage", "calme", "détente", "baie", "paisible", "repos"},
    ),
    "découverte": (
        {"culture", "histoire", "marché", "artisanat"},
        {"market", "attraction", "museum"},
        {"musée", "marché", "histoire", "tradition", "artisanat", "patrimoine"},
    ),
}

# Occasion aliases -> canonical key
OCCASION_ALIASES = {
    "romantique": "romantique", "romance": "romantique", "couple": "romantique",
    "famille": "famille", "enfants": "famille", "familial": "famille",
    "amis": "amis", "entre amis": "amis", "sortie": "amis", "nightlife": "amis",
    "solo": "solo", "seul": "solo", "solitaire": "solo",
    "affaires": "affaires", "business": "affaires", "travail": "affaires",
    "aventure": "aventure", "aventurier": "aventure", "aventureux": "aventure",
    "detente": "detente", "détente": "detente", "relax": "detente",
    "repos": "detente", "bien etre": "detente", "bien-être": "detente",
    "decouverte": "découverte", "découverte": "découverte", "culture": "découverte",
    "tourisme": "découverte",
}

EMPTY_PREFS_EPSILON = 0.01


def _norm(value: str) -> str:
    """Normalise for matching: lowercase, strip accents, collapse spaces."""
    if not value:
        return ""
    import unicodedata
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    return " ".join(value.lower().split())


def canonical_occasion(occasion: str | None) -> str | None:
    """Map a user-supplied occasion to a canonical key (case/diacritics safe)."""
    if not occasion:
        return None
    key = _norm(occasion)
    return OCCASION_ALIASES.get(key)


def _is_libreville(dest: dict) -> bool:
    city = _norm(dest.get("city") or "")
    country = _norm(dest.get("country") or "")
    if city and city == HOME_CITY:
        return True
    if city in CITY_HINTS:
        return True
    if city and ("libreville" in city or city in {"akanda", "estuaire"}):
        return True
    # Country-level fallback: Gabonese/likely-Libreville destinations with no
    # city field (e.g. approved proposals) are still relevant.
    if not city and country in {HOME_COUNTRY, _norm("Gabon")}:
        return True
    return False


def _score_destination(dest: dict, preferences: list, occasion: str | None) -> float:
    """Compute a deterministic relevance score in [0, inf)."""
    tags = [_norm(t) for t in (dest.get("tags") or [])]
    category = _norm(dest.get("category") or "")
    name = _norm(dest.get("name") or "")
    desc = _norm(dest.get("description") or "")
    text = f"{name} {desc}"

    score = 0.0

    # 1) Preference-tag matches (+1 each)
    for pref in preferences:
        pref_norm = _norm(pref)
        if not pref_norm:
            continue
        if pref_norm in tags or f" {pref_norm} " in f" {text} ":
            score += 1.0

    # 2) Occasion profile (weighted, up to +3 bonus)
    if occasion:
        occ_tags, occ_cats, occ_words = OCCASION_PROFILES.get(occasion, (set(), set(), ()))
        tag_hits = sum(1 for t in occ_tags if t in tags)
        cat_hit = 1.0 if category in occ_cats else 0.0
        word_hits = sum(1 for w in occ_words if f" {w} " in f" {text} ")
        score += tag_hits * 0.8
        score += cat_hit * 1.0
        score += min(word_hits, 3) * 0.4

    # 3) Quality bonus: better-rated places rank higher among ties
    rating = float(dest.get("rating") or 0)
    if rating >= 4.5:
        score += 0.35
    elif rating >= 4.0:
        score += 0.15

    return score


def get_recommendations(username: str, limit: int = 5,
                        occasion: str | None = None,
                        city: str | None = None) -> list:
    """Return top-*limit* destinations for *username*.

    - preferences come from the RabbitMQ cache, else fall back to a
      synchronous UserService call;
    - destinations come from the RabbitMQ cache, else fall back to a
      synchronous ItineraryService call;
    - Libreville focus is the default; pass city="all" to disable it.
    """
    # 1. Preferences
    preferences = USER_PREFERENCES.get(username) or client.get_user_preferences(username)
    preferences = [p for p in (preferences or []) if p and str(p).strip()]

    # 2. Destinations
    destinations = DESTINATIONS_CACHE or client.get_all_destinations()
    if not destinations:
        return []

    # 3. Libreville focus
    focus_city = _norm(city) if city else HOME_CITY
    if focus_city and focus_city != "all":
        destinations = [d for d in destinations if _is_libreville(d)]

    # 4. Score
    canonical = canonical_occasion(occasion) if occasion else None
    scored = [
        (_score_destination(d, preferences, canonical) + EMPTY_PREFS_EPSILON, d)
        for d in destinations
    ]

    # 5. Sort: score desc, rating desc, name asc
    scored.sort(key=lambda x: (-x[0], -(float(x[1].get("rating") or 0)),
                                _norm(x[1].get("name") or "")))

    # 6. Build response
    results = []
    for score, dest in scored[:limit]:
        results.append({
            "id": dest.get("id", ""),
            "name": dest.get("name", ""),
            "country": dest.get("country", ""),
            "city": dest.get("city", ""),
            "description": dest.get("description", ""),
            "tags": dest.get("tags", []),
            "avg_cost_per_day": dest.get("avg_cost_per_day", 0),
            "image": dest.get("image", "g1.jpg"),
            "rating": dest.get("rating", 4.0),
            "match_score": round(score, 3),
            "occasion": canonical,
        })
    return results
