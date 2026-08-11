"""
app/reviews.py

Reviews and visited destinations endpoints.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

from .auth import token_required
from .models import (
    get_all_reviews,
    get_reviews_for_destination,
    save_review,
    delete_review,
    get_visited_destinations,
    add_visited_destination,
    remove_visited_destination,
    get_favorite_notes,
    get_favorite_note,
    save_favorite_note,
    delete_favorite_note,
)

bp = Blueprint("reviews", __name__)


# ---------------------------------------------------------------------------
# REVIEWS (Commentaires publics sur destinations)
# ---------------------------------------------------------------------------

@bp.route("/reviews", methods=["GET"])
def list_reviews():
    """List all reviews, optionally filtered by destination."""
    destination = request.args.get("destination")
    
    if destination:
        reviews = get_reviews_for_destination(destination)
    else:
        reviews = get_all_reviews()
    
    # Sort by date (newest first)
    reviews.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return jsonify(reviews), 200


@bp.route("/reviews", methods=["POST"])
@token_required
def create_review(current_user: str):
    """Create a new review for a destination."""
    data = request.get_json()
    
    destination_name = data.get("destination_name")
    rating = data.get("rating")  # 1-5
    comment = data.get("comment")
    
    if not destination_name or not rating or not comment:
        return jsonify({"error": "destination_name, rating, and comment are required"}), 400
    
    if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
        return jsonify({"error": "rating must be between 1 and 5"}), 400
    
    review = {
        "id": str(uuid.uuid4()),
        "username": current_user,
        "destination_name": destination_name,
        "rating": float(rating),
        "comment": comment.strip(),
        "created_at": datetime.utcnow().isoformat(),
    }
    
    save_review(review)
    
    return jsonify(review), 201


@bp.route("/reviews/<review_id>", methods=["DELETE"])
@token_required
def remove_review(current_user: str, review_id: str):
    """Delete a review (only if it belongs to current user or admin)."""
    success = delete_review(review_id, current_user)
    
    if success:
        return jsonify({"message": "Review deleted"}), 200
    else:
        return jsonify({"error": "Review not found or unauthorized"}), 404


@bp.route("/reviews/<review_id>", methods=["PUT"])
@token_required
def edit_review(current_user: str, review_id: str):
    """Edit a review (only if it belongs to current user or admin)."""
    data = request.get_json() or {}
    rating = data.get("rating")
    comment = data.get("comment")
    
    all_reviews = get_all_reviews()
    for review in all_reviews:
        if review.get("id") == review_id and (review.get("username") == current_user or current_user == "admin"):
            if rating is not None and isinstance(rating, (int, float)) and 1 <= rating <= 5:
                review["rating"] = float(rating)
            if comment:
                review["comment"] = comment.strip()
            review["updated_at"] = datetime.utcnow().isoformat()
            from .models import _write_json, REVIEWS_FILE
            _write_json(REVIEWS_FILE, all_reviews)
            return jsonify(review), 200
            
    return jsonify({"error": "Review not found or unauthorized"}), 404


# ---------------------------------------------------------------------------
# VISITED DESTINATIONS
# ---------------------------------------------------------------------------

@bp.route("/visited", methods=["GET"])
@token_required
def list_visited(current_user: str):
    """Get list of destinations the user has visited."""
    visited = get_visited_destinations(current_user)
    return jsonify(visited), 200


@bp.route("/visited", methods=["POST"])
@token_required
def mark_visited(current_user: str):
    """Mark a destination as visited."""
    data = request.get_json()
    destination_name = data.get("destination_name")
    
    if not destination_name:
        return jsonify({"error": "destination_name is required"}), 400
    
    add_visited_destination(current_user, destination_name)
    
    return jsonify({
        "message": "Destination marked as visited",
        "destination_name": destination_name
    }), 200


@bp.route("/visited/<destination_name>", methods=["DELETE"])
@token_required
def unmark_visited(current_user: str, destination_name: str):
    """Remove a destination from visited list."""
    remove_visited_destination(current_user, destination_name)
    
    return jsonify({"message": "Destination removed from visited"}), 200


# ---------------------------------------------------------------------------
# FAVORITE NOTES (Notes personnelles sur favoris)
# ---------------------------------------------------------------------------

@bp.route("/favorite-notes", methods=["GET"])
@token_required
def list_favorite_notes(current_user: str):
    """Get all favorite notes for the current user."""
    notes = get_favorite_notes(current_user)
    return jsonify(notes), 200


@bp.route("/favorite-notes/<destination_name>", methods=["GET"])
@token_required
def get_note(current_user: str, destination_name: str):
    """Get note for a specific favorite destination."""
    note = get_favorite_note(current_user, destination_name)
    
    if note:
        return jsonify(note), 200
    else:
        return jsonify({}), 200


@bp.route("/favorite-notes", methods=["POST"])
@token_required
def create_or_update_note(current_user: str):
    """Create or update a note for a favorite destination."""
    data = request.get_json()
    
    destination_name = data.get("destination_name")
    note = data.get("note", "")
    visit_date = data.get("visit_date")
    companions = data.get("companions", "")
    budget = data.get("budget")
    
    if not destination_name:
        return jsonify({"error": "destination_name is required"}), 400
    
    note_data = {
        "note": note.strip(),
        "visit_date": visit_date,
        "companions": companions.strip(),
        "budget": float(budget) if budget else None,
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    save_favorite_note(current_user, destination_name, note_data)
    
    return jsonify({
        "message": "Note saved",
        "destination_name": destination_name,
        "note": note_data
    }), 200


@bp.route("/favorite-notes/<destination_name>", methods=["DELETE"])
@token_required
def remove_note(current_user: str, destination_name: str):
    """Delete a favorite note."""
    delete_favorite_note(current_user, destination_name)
    
    return jsonify({"message": "Note deleted"}), 200
