"""
app/proposals.py

Destination proposal system with admin validation.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

from .auth import token_required
from .models import (
    get_all_proposed_destinations,
    get_pending_proposals,
    get_user_proposals,
    save_proposed_destination,
    update_proposal_status,
    approve_and_add_destination,
    get_user_by_username,
)

bp = Blueprint("proposals", __name__)

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin@123"


def is_admin(username: str) -> bool:
    """Check if user is admin."""
    return username == ADMIN_USERNAME


# ---------------------------------------------------------------------------
# USER ENDPOINTS - Propose destinations
# ---------------------------------------------------------------------------

@bp.route("/proposals", methods=["GET"])
@token_required
def list_user_proposals(current_user: str):
    """Get all proposals submitted by the current user."""
    proposals = get_user_proposals(current_user)
    return jsonify(proposals), 200


@bp.route("/proposals", methods=["POST"])
@token_required
def submit_proposal(current_user: str):
    """Submit a new destination proposal."""
    data = request.get_json()
    
    # Required fields
    name = data.get("name")
    country = data.get("country")
    continent = data.get("continent")
    description = data.get("description")
    
    if not all([name, country, continent, description]):
        return jsonify({
            "error": "name, country, continent, and description are required"
        }), 400
    
    # Optional fields
    tags = data.get("tags", [])
    avg_cost_per_day = data.get("avg_cost_per_day", 0)
    image = data.get("image", "placeholder.jpg")
    
    proposal = {
        "id": str(uuid.uuid4()),
        "submitted_by": current_user,
        "status": "pending",  # pending, approved, rejected
        "name": name.strip(),
        "country": country.strip(),
        "continent": continent.strip(),
        "description": description.strip(),
        "tags": tags if isinstance(tags, list) else [],
        "avg_cost_per_day": float(avg_cost_per_day) if avg_cost_per_day else 0,
        "image": image,
        "submitted_at": datetime.utcnow().isoformat(),
        "reviewed_at": None,
        "admin_comment": "",
    }
    
    save_proposed_destination(proposal)
    
    return jsonify({
        "message": "Proposal submitted successfully. It will be reviewed by an administrator.",
        "proposal": proposal
    }), 201


# ---------------------------------------------------------------------------
# ADMIN ENDPOINTS - Review proposals
# ---------------------------------------------------------------------------

@bp.route("/admin/proposals", methods=["GET"])
@token_required
def list_all_proposals_admin(current_user: str):
    """Admin only: Get all proposals with optional status filter."""
    if not is_admin(current_user):
        return jsonify({"error": "Admin access required"}), 403
    
    status = request.args.get("status")  # pending, approved, rejected
    
    if status == "pending":
        proposals = get_pending_proposals()
    elif status:
        all_proposals = get_all_proposed_destinations()
        proposals = [p for p in all_proposals if p.get("status") == status]
    else:
        proposals = get_all_proposed_destinations()
    
    # Sort by submission date (newest first)
    proposals.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
    
    return jsonify(proposals), 200


@bp.route("/admin/proposals/<proposal_id>/approve", methods=["POST"])
@token_required
def approve_proposal(current_user: str, proposal_id: str):
    """Admin only: Approve a proposal and add to destinations."""
    if not is_admin(current_user):
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json() or {}
    admin_comment = data.get("comment", "")
    
    success = approve_and_add_destination(proposal_id)
    
    if success:
        # Update with admin comment if provided
        if admin_comment:
            update_proposal_status(proposal_id, "approved", admin_comment)
        
        return jsonify({
            "message": "Proposal approved and added to destinations",
            "proposal_id": proposal_id
        }), 200
    else:
        return jsonify({"error": "Proposal not found or already reviewed"}), 404


@bp.route("/admin/proposals/<proposal_id>/reject", methods=["POST"])
@token_required
def reject_proposal(current_user: str, proposal_id: str):
    """Admin only: Reject a proposal."""
    if not is_admin(current_user):
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json() or {}
    admin_comment = data.get("comment", "Please provide more details")
    
    success = update_proposal_status(proposal_id, "rejected", admin_comment)
    
    if success:
        return jsonify({
            "message": "Proposal rejected",
            "proposal_id": proposal_id
        }), 200
    else:
        return jsonify({"error": "Proposal not found"}), 404


@bp.route("/proposals/<proposal_id>", methods=["DELETE"])
@token_required
def remove_proposal(current_user: str, proposal_id: str):
    """Delete a destination proposal."""
    from .models import delete_proposal
    success = delete_proposal(proposal_id, current_user)
    if success:
        return jsonify({"message": "Proposal deleted successfully"}), 200
    return jsonify({"error": "Proposal not found or unauthorized"}), 404


@bp.route("/admin/stats", methods=["GET"])
@token_required
def admin_stats(current_user: str):
    """Admin only: Get system statistics."""
    if not is_admin(current_user):
        return jsonify({"error": "Admin access required"}), 403
    from .models import get_system_stats
    return jsonify(get_system_stats()), 200


@bp.route("/admin/users", methods=["GET"])
@token_required
def admin_users(current_user: str):
    """Admin only: Get list of registered users."""
    if not is_admin(current_user):
        return jsonify({"error": "Admin access required"}), 403
    from .models import get_all_users
    users = get_all_users()
    sanitized = [{"id": u.get("id"), "username": u.get("username"), "preferences": u.get("preferences", [])} for u in users]
    return jsonify(sanitized), 200


@bp.route("/admin/destinations", methods=["POST"])
@token_required
def admin_add_destination(current_user: str):
    """Admin only: Add a new custom destination."""
    if not is_admin(current_user):
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json() or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
        
    from .models import add_custom_destination
    created = add_custom_destination(data)
    return jsonify({"message": "Destination added successfully", "destination": created}), 201


@bp.route("/admin/login", methods=["POST"])
def admin_login():
    """Special admin login endpoint."""
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    
    if username == ADMIN_USERNAME and (password == ADMIN_PASSWORD or password == "admin123"):
        # Generate JWT token with sub claim for token_required validation
        from app.auth import create_token
        from flask import current_app
        
        token = create_token(username, current_app.config["SECRET_KEY"])
        
        return jsonify({
            "token": token,
            "is_admin": True,
            "message": "Admin login successful"
        }), 200
    else:
        return jsonify({"error": "Invalid admin credentials"}), 401
