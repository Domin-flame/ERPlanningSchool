"""
app/models.py

Data models and file I/O helpers.

All persistent data is stored in JSON files under the /data directory.
  - data/users.json       – registered users
  - data/itineraries.json – user itineraries
  - data/destinations.json – static destination catalogue (seed data)
"""
import json
import os

# Resolve the /data directory relative to this file's location so the app
# works regardless of the current working directory.
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(_BASE_DIR, "data")

USERS_FILE = os.path.join(DATA_DIR, "users.json")
ITINERARIES_FILE = os.path.join(DATA_DIR, "itineraries.json")
POIS_FILE = os.path.join(DATA_DIR, "pois.json")
REVIEWS_FILE = os.path.join(DATA_DIR, "reviews.json")
VISITED_FILE = os.path.join(DATA_DIR, "visited.json")
FAVORITE_NOTES_FILE = os.path.join(DATA_DIR, "favorite_notes.json")
PROPOSED_DESTINATIONS_FILE = os.path.join(DATA_DIR, "proposed_destinations.json")

# In-memory cache for pois.json
_POIS_CACHE = {
    "mtime": 0,
    "destinations": []
}


def _load_pois_destinations() -> list:
    """Load POIs from pois.json, transforming them into Destination objects.
    Uses in-memory caching based on file modification timestamp (mtime).
    """
    if not os.path.exists(POIS_FILE):
        return []

    try:
        current_mtime = os.path.getmtime(POIS_FILE)
    except OSError:
        current_mtime = 0

    if _POIS_CACHE["mtime"] == current_mtime and _POIS_CACHE["destinations"]:
        return _POIS_CACHE["destinations"]

    with open(POIS_FILE, "r", encoding="utf-8") as fh:
        raw_data = json.load(fh)
        pois = raw_data.get("pois", [])

    category_tags = {
        "bar": ["nightlife", "food"],
        "restaurant": ["food", "culture"],
        "park": ["nature", "wellness", "adventure"],
        "attraction": ["culture", "nature", "adventure"],
        "mall": ["shopping", "food", "culture"]
    }
    price_costs = {"budget": 35, "moderate": 75, "luxury": 150}

    destinations = []
    for poi in pois:
        cat = poi.get("category", "").lower()
        tags = category_tags.get(cat, ["culture"])
        price = poi.get("price_level", "budget").lower()
        cost = price_costs.get(price, 50)

        dest = {
            "id": poi.get("id"),
            "name": poi.get("name_fr") or poi.get("name", ""),
            "name_en": poi.get("name", "") or poi.get("name_fr", ""),
            "name_fr": poi.get("name_fr", "") or poi.get("name", ""),
            "original_name": poi.get("name", ""),
            "country": poi.get("country", "Cameroun"),
            "continent": "Afrique",
            "city": poi.get("city", ""),
            "description": poi.get("description_fr") or poi.get("description", ""),
            "description_en": poi.get("description", "") or poi.get("description_fr", ""),
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
            "website": poi.get("website", "")
        }
        destinations.append(dest)

    _POIS_CACHE["mtime"] = current_mtime
    _POIS_CACHE["destinations"] = destinations
    return destinations


# ---------------------------------------------------------------------------
# Generic file I/O helpers
# ---------------------------------------------------------------------------

def _read_json(filepath: str) -> list:
    """Read a JSON file and return its contents as a Python list.

    Returns an empty list if the file does not exist or is empty.
    """
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as fh:
        content = fh.read().strip()
        if not content:
            return []
        return json.loads(content)


def _write_json(filepath: str, data: list) -> None:
    """Serialise *data* and write it to *filepath* (pretty-printed)."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

def get_all_users() -> list:
    """Return all registered users."""
    return _read_json(USERS_FILE)


def get_user_by_username(username: str) -> dict | None:
    """Return the user dict for *username*, or None if not found."""
    users = get_all_users()
    for user in users:
        if user.get("username") == username:
            return user
    return None


def save_user(user: dict) -> None:
    """Append *user* to the users store."""
    users = get_all_users()
    users.append(user)
    _write_json(USERS_FILE, users)


# ---------------------------------------------------------------------------
# Destination helpers
# ---------------------------------------------------------------------------

def get_all_destinations() -> list:
    """Return all destinations from pois.json and approved user proposals."""
    pois_destinations = _load_pois_destinations()

    # Include approved proposals from proposed_destinations.json
    approved_proposals = get_approved_proposals()
    proposal_destinations = []
    for prop in approved_proposals:
        p_dest = {
            "id": prop.get("id"),
            "name": prop.get("name"),
            "country": prop.get("country"),
            "continent": prop.get("continent"),
            "description": prop.get("description"),
            "tags": prop.get("tags", []),
            "avg_cost_per_day": prop.get("avg_cost_per_day", 0),
            "image": prop.get("image", "placeholder.jpg"),
        }
        proposal_destinations.append(p_dest)

    return pois_destinations + proposal_destinations


# ---------------------------------------------------------------------------
# Itinerary helpers
# ---------------------------------------------------------------------------

def get_all_itineraries() -> list:
    """Return all itineraries across all users."""
    return _read_json(ITINERARIES_FILE)


def get_itineraries_for_user(username: str) -> list:
    """Return itineraries that belong to *username*."""
    return [it for it in get_all_itineraries() if it.get("username") == username]


def save_itinerary(itinerary: dict) -> None:
    """Append *itinerary* to the itineraries store."""
    itineraries = get_all_itineraries()
    itineraries.append(itinerary)
    _write_json(ITINERARIES_FILE, itineraries)


# ---------------------------------------------------------------------------
# Reviews helpers (Commentaires publics)
# ---------------------------------------------------------------------------

def get_all_reviews() -> list:
    """Return all reviews across all destinations."""
    return _read_json(REVIEWS_FILE)


def get_reviews_for_destination(destination_name: str) -> list:
    """Return all reviews for a specific destination."""
    all_reviews = get_all_reviews()
    return [r for r in all_reviews if r.get("destination_name") == destination_name]


def save_review(review: dict) -> None:
    """Append a new review to the reviews store."""
    reviews = get_all_reviews()
    reviews.append(review)
    _write_json(REVIEWS_FILE, reviews)


def delete_review(review_id: str, username: str) -> bool:
    """Delete a review by id if it belongs to the user."""
    reviews = get_all_reviews()
    initial_length = len(reviews)
    reviews = [r for r in reviews if not (r.get("id") == review_id and r.get("username") == username)]
    if len(reviews) < initial_length:
        _write_json(REVIEWS_FILE, reviews)
        return True
    return False


# ---------------------------------------------------------------------------
# Visited Destinations helpers
# ---------------------------------------------------------------------------

def get_visited_destinations(username: str) -> list:
    """Return list of visited destination names for a user."""
    all_visited = _read_json(VISITED_FILE)
    for entry in all_visited:
        if entry.get("username") == username:
            return entry.get("destinations", [])
    return []


def add_visited_destination(username: str, destination_name: str) -> None:
    """Mark a destination as visited by a user."""
    all_visited = _read_json(VISITED_FILE)
    
    # Find user's entry
    user_entry = None
    for entry in all_visited:
        if entry.get("username") == username:
            user_entry = entry
            break
    
    # Create or update
    if user_entry:
        if destination_name not in user_entry.get("destinations", []):
            user_entry["destinations"].append(destination_name)
    else:
        all_visited.append({
            "username": username,
            "destinations": [destination_name]
        })
    
    _write_json(VISITED_FILE, all_visited)


def remove_visited_destination(username: str, destination_name: str) -> None:
    """Remove a destination from visited list."""
    all_visited = _read_json(VISITED_FILE)
    
    for entry in all_visited:
        if entry.get("username") == username:
            destinations = entry.get("destinations", [])
            if destination_name in destinations:
                destinations.remove(destination_name)
            break
    
    _write_json(VISITED_FILE, all_visited)


# ---------------------------------------------------------------------------
# Favorite Notes helpers (Notes personnelles sur favoris)
# ---------------------------------------------------------------------------

def get_favorite_notes(username: str) -> dict:
    """Return all favorite notes for a user.
    
    Format: {destination_name: {note, visit_date, companions, budget}}
    """
    all_notes = _read_json(FAVORITE_NOTES_FILE)
    for entry in all_notes:
        if entry.get("username") == username:
            return entry.get("notes", {})
    return {}


def get_favorite_note(username: str, destination_name: str) -> dict | None:
    """Get note for a specific favorite destination."""
    notes = get_favorite_notes(username)
    return notes.get(destination_name)


def save_favorite_note(username: str, destination_name: str, note_data: dict) -> None:
    """Save or update a note for a favorite destination.
    
    note_data: {
        "note": str,
        "visit_date": str (optional),
        "companions": str (optional),
        "budget": float (optional)
    }
    """
    all_notes = _read_json(FAVORITE_NOTES_FILE)
    
    # Find user's entry
    user_entry = None
    for entry in all_notes:
        if entry.get("username") == username:
            user_entry = entry
            break
    
    # Create or update
    if user_entry:
        user_entry["notes"][destination_name] = note_data
    else:
        all_notes.append({
            "username": username,
            "notes": {destination_name: note_data}
        })
    
    _write_json(FAVORITE_NOTES_FILE, all_notes)


def delete_favorite_note(username: str, destination_name: str) -> None:
    """Delete a favorite note."""
    all_notes = _read_json(FAVORITE_NOTES_FILE)
    
    for entry in all_notes:
        if entry.get("username") == username:
            notes = entry.get("notes", {})
            if destination_name in notes:
                del notes[destination_name]
            break
    
    _write_json(FAVORITE_NOTES_FILE, all_notes)



# ---------------------------------------------------------------------------
# Proposed Destinations helpers (Propositions utilisateurs)
# ---------------------------------------------------------------------------

def get_all_proposed_destinations() -> list:
    """Return all proposed destinations."""
    return _read_json(PROPOSED_DESTINATIONS_FILE)


def get_pending_proposals() -> list:
    """Return proposals waiting for approval."""
    all_proposals = get_all_proposed_destinations()
    return [p for p in all_proposals if p.get("status") == "pending"]


def get_approved_proposals() -> list:
    """Return approved proposals."""
    all_proposals = get_all_proposed_destinations()
    return [p for p in all_proposals if p.get("status") == "approved"]


def get_rejected_proposals() -> list:
    """Return rejected proposals."""
    all_proposals = get_all_proposed_destinations()
    return [p for p in all_proposals if p.get("status") == "rejected"]


def get_user_proposals(username: str) -> list:
    """Return all proposals submitted by a user."""
    all_proposals = get_all_proposed_destinations()
    return [p for p in all_proposals if p.get("submitted_by") == username]


def save_proposed_destination(proposal: dict) -> None:
    """Add a new destination proposal."""
    proposals = get_all_proposed_destinations()
    proposals.append(proposal)
    _write_json(PROPOSED_DESTINATIONS_FILE, proposals)


def update_proposal_status(proposal_id: str, status: str, admin_comment: str = "") -> bool:
    """Update the status of a proposal (approve or reject)."""
    proposals = get_all_proposed_destinations()
    
    for proposal in proposals:
        if proposal.get("id") == proposal_id:
            proposal["status"] = status
            proposal["admin_comment"] = admin_comment
            proposal["reviewed_at"] = __import__("datetime").datetime.utcnow().isoformat()
            _write_json(PROPOSED_DESTINATIONS_FILE, proposals)
            return True
    
    return False


def approve_and_add_destination(proposal_id: str) -> bool:
    """Approve a proposal and add it to the main destinations catalog."""
    proposals = get_all_proposed_destinations()
    
    for proposal in proposals:
        if proposal.get("id") == proposal_id and proposal.get("status") == "pending":
            # Update proposal status to approved
            proposal["status"] = "approved"
            proposal["reviewed_at"] = __import__("datetime").datetime.utcnow().isoformat()
            _write_json(PROPOSED_DESTINATIONS_FILE, proposals)
            return True
    
    return False


def delete_itinerary(itinerary_id: str, username: str) -> bool:
    """Delete an itinerary by id for a specific user (or admin)."""
    itineraries = get_all_itineraries()
    initial_length = len(itineraries)
    itineraries = [it for it in itineraries if not (it.get("id") == itinerary_id and (it.get("username") == username or username == "admin"))]
    if len(itineraries) < initial_length:
        _write_json(ITINERARIES_FILE, itineraries)
        return True
    return False


def update_itinerary(itinerary_id: str, username: str, data: dict) -> bool:
    """Update an itinerary by id."""
    itineraries = get_all_itineraries()
    for itinerary in itineraries:
        if itinerary.get("id") == itinerary_id and (itinerary.get("username") == username or username == "admin"):
            if "title" in data:
                itinerary["title"] = data["title"].strip()
            if "destinations" in data:
                itinerary["destinations"] = data["destinations"]
            if "start_date" in data:
                itinerary["start_date"] = data["start_date"]
            if "end_date" in data:
                itinerary["end_date"] = data["end_date"]
            if "notes" in data:
                itinerary["notes"] = data["notes"]
            itinerary["updated_at"] = __import__("datetime").datetime.utcnow().isoformat()
            _write_json(ITINERARIES_FILE, itineraries)
            return True
    return False


def delete_proposal(proposal_id: str, username: str) -> bool:
    """Delete a destination proposal."""
    proposals = get_all_proposed_destinations()
    initial_length = len(proposals)
    proposals = [p for p in proposals if not (p.get("id") == proposal_id and (p.get("submitted_by") == username or username == "admin"))]
    if len(proposals) < initial_length:
        _write_json(PROPOSED_DESTINATIONS_FILE, proposals)
        return True
    return False


def update_user_profile(username: str, data: dict) -> dict | None:
    """Update user profile preferences, password, avatar, or preferences."""
    users = get_all_users()
    for user in users:
        if user.get("username") == username:
            if "preferences" in data and isinstance(data["preferences"], list):
                user["preferences"] = data["preferences"]
            if "avatar" in data:
                user["avatar"] = data["avatar"]
            if "password" in data and data["password"]:
                from werkzeug.security import generate_password_hash
                user["password_hash"] = generate_password_hash(data["password"])
            _write_json(USERS_FILE, users)
            return user
    return None


def add_custom_destination(dest_data: dict) -> dict:
    """Admin function: Add a new custom destination directly to POIs cache / catalog."""
    proposal = {
        "id": "custom_" + str(__import__("uuid").uuid4()),
        "submitted_by": "admin",
        "status": "approved",
        "name": dest_data.get("name", "").strip(),
        "country": dest_data.get("country", "Cameroun").strip(),
        "continent": dest_data.get("continent", "Afrique").strip(),
        "city": dest_data.get("city", "Yaoundé").strip(),
        "description": dest_data.get("description", "").strip(),
        "tags": dest_data.get("tags", []),
        "avg_cost_per_day": float(dest_data.get("avg_cost_per_day", 50)),
        "image": dest_data.get("image", "g1.jpg"),
        "submitted_at": __import__("datetime").datetime.utcnow().isoformat(),
        "reviewed_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
    save_proposed_destination(proposal)
    return proposal


def get_system_stats() -> dict:
    """Return overall statistics for Admin Dashboard."""
    users = get_all_users()
    destinations = get_all_destinations()
    proposals = get_all_proposed_destinations()
    reviews = get_all_reviews()
    
    pending_proposals = [p for p in proposals if p.get("status") == "pending"]
    approved_proposals = [p for p in proposals if p.get("status") == "approved"]
    
    return {
        "total_users": len(users),
        "total_destinations": len(destinations),
        "total_proposals": len(proposals),
        "pending_proposals": len(pending_proposals),
        "approved_proposals": len(approved_proposals),
        "total_reviews": len(reviews)
    }
