"""
app/__init__.py

Flask application factory.
"""
import os
from flask import Flask, render_template
from flask import send_from_directory


def create_app():
    """Create and configure the Flask application.

    The Flask ``__name__`` is ``app`` (the package directory), so relative
    template/static folders are resolved against the ``app/`` package.  We use
    absolute paths anchored at the repository root so the web frontend under
    ``Frontend/`` is found no matter where the process is launched from.
    """
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(root_dir, "Frontend", "src")
    static_dir = os.path.join(root_dir, "Frontend")

    app = Flask(
        __name__,
        template_folder=template_dir,
        static_folder=static_dir,
        static_url_path="/static",
    )

    # Secret key used for JWT signing.  Set the SECRET_KEY environment variable
    # in production.  The fallback is intentionally weak and must never be used
    # outside of local development.
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "globetrotter-secret-change-in-prod"
    )

    # Register all route blueprints
    from app.auth import auth_bp
    from app.destinations import destinations_bp
    from app.recommendations import recommendations_bp
    from app.itineraries import itineraries_bp
    from app.reviews import bp as reviews_bp
    from app.proposals import bp as proposals_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(destinations_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(itineraries_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(proposals_bp)

    @app.route("/", methods=["GET"])
    def home():
        """Render the GlobeTrotter web experience."""
        return render_template("index.html")

    @app.route("/assets/<path:filename>", methods=["GET"])
    def assets(filename):
        """Serve project images provided in the root img directory."""
        assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "img")
        return send_from_directory(assets_dir, filename)

    return app
