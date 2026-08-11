"""
Unit tests for the RecommendationService scoring engine.

Run from the repo root:

    python -m pytest tests/test_recommendations.py -v

These tests exercise the pure logic of `service.py` (Libreville focus,
occasion personalisation, preference scoring) without requiring the RabbitMQ
cache or the UserService/ItineraryService network calls.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__),
                                "..", "microservices", "recommendation_service"))

from app import service


DEST_PLAGE = {
    "id": "poi_lb_003",
    "name": "Plage Leon Mba",
    "country": "Gabon",
    "city": "Libreville",
    "description": "Plage accessible pour une pause simple au bord de mer.",
    "tags": ["plage", "détente", "nature", "coucher"],
    "category": "beach",
    "rating": 4.1,
    "avg_cost_per_day": 35,
    "image": "g3.jpg",
}
DEST_MARCHE = {
    "id": "poi_lb_008",
    "name": "Marche de Mont-Bouet",
    "country": "Gabon",
    "city": "Libreville",
    "description": "Marche populaire pour produits frais et artisanat.",
    "tags": ["marché", "artisanat", "culture", "local"],
    "category": "market",
    "rating": 4.3,
    "avg_cost_per_day": 35,
    "image": "g8.jpg",
}
DEST_MUSEE = {
    "id": "poi_lb_021",
    "name": "Musee National",
    "country": "Gabon",
    "city": "Libreville",
    "description": "Musee des arts et traditions du Gabon.",
    "tags": ["musée", "culture", "histoire"],
    "category": "museum",
    "rating": 4.8,
    "avg_cost_per_day": 25,
    "image": "g2.jpg",
}
DEST_YAOUNDE = {
    "id": "poi_other_999",
    "name": "Marche Central de Yaounde",
    "country": "Cameroun",
    "city": "Yaoundé",
    "description": "Grand marche de la capitale camerounaise.",
    "tags": ["marché", "artisanat"],
    "category": "market",
    "rating": 4.6,
    "avg_cost_per_day": 30,
    "image": "g9.jpg",
}


from contextlib import contextmanager


@contextmanager
def _patch_cache(username_prefs, destinations):
    """Temporarily replace the module-level caches used by get_recommendations."""
    old_prefs = dict(service.USER_PREFERENCES)
    old_dests = list(service.DESTINATIONS_CACHE)
    service.USER_PREFERENCES.clear()
    service.USER_PREFERENCES[username_prefs[0]] = username_prefs[1]
    service.DESTINATIONS_CACHE[:] = destinations
    try:
        yield
    finally:
        service.USER_PREFERENCES.clear()
        service.USER_PREFERENCES.update(old_prefs)
        service.DESTINATIONS_CACHE[:] = old_dests


def test_canonical_occasion_handles_accents():
    assert service.canonical_occasion("Détente") == "detente"
    assert service.canonical_occasion("entre amis") == "amis"
    assert service.canonical_occasion("romance") == "romantique"
    assert service.canonical_occasion("inconnu") is None
    assert service.canonical_occasion("") is None


def test_is_libreville_filters():
    assert service._is_libreville(DEST_PLAGE) is True
    assert service._is_libreville(DEST_MARCHE) is True
    assert service._is_libreville(DEST_YAOUNDE) is False
    # Gabonese destination without city still passes (approved proposals)
    assert service._is_libreville({
        "country": "Gabon", "city": "", "name": "Baie des Rois"
    }) is True


def test_preferences_drive_scoring():
    # User who likes "nature" should rank the beach above the market.
    places = [DEST_MARCHE, DEST_PLAGE, DEST_MUSEE]
    with _patch_cache(("alice", ["nature"]), places):
        results = service.get_recommendations("alice", limit=3)
    top = results[0]["name"]
    assert top == DEST_PLAGE["name"], f"expected beach first, got {top}"


def test_occasion_personalisation():
    # "famille" should boost the beach (tag 'plage'), not the museum.
    places = [DEST_MUSEE, DEST_PLAGE]
    with _patch_cache(("bob", []), places):
        results_occasion = service.get_recommendations(
            "bob", limit=2, occasion="famille"
        )
    assert results_occasion[0]["name"] == DEST_PLAGE["name"]
    assert results_occasion[0]["occasion"] == "famille"

    # "decouverte" should boost the museum (museum/histoire tags).
    with _patch_cache(("bob", []), places):
        results_decouverte = service.get_recommendations(
            "bob", limit=2, occasion="decouverte"
        )
    assert results_decouverte[0]["name"] == DEST_MUSEE["name"]


def test_libreville_focus_default_and_city_all():
    places = [DEST_PLAGE, DEST_YAOUNDE]
    with _patch_cache(("carol", []), places):
        default_results = service.get_recommendations("carol", limit=5)
        # Default: Libreville only -> Yaoundé excluded.
        names = [r["name"] for r in default_results]
        assert DEST_YAOUNDE["name"] not in names

        all_results = service.get_recommendations("carol", limit=5, city="all")
        all_names = [r["name"] for r in all_results]
        assert DEST_YAOUNDE["name"] in all_names


def test_empty_preferences_still_returns_ordered_list():
    places = [DEST_MARCHE, DEST_PLAGE, DEST_MUSEE]
    with _patch_cache(("dave", []), places):
        results = service.get_recommendations("dave", limit=3)
    assert len(results) == 3
    # With no preferences, quality bonus decides: museum (4.8) first.
    assert results[0]["name"] == DEST_MUSEE["name"]


def test_limit_respected_and_response_shape():
    places = [DEST_MARCHE, DEST_PLAGE, DEST_MUSEE]
    with _patch_cache(("eve", ["culture"]), places):
        results = service.get_recommendations("eve", limit=2)
    assert len(results) == 2
    for r in results:
        assert isinstance(r["match_score"], float)
        assert "occasion" in r
        assert r["city"] == "Libreville"
