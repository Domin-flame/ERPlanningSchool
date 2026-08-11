"""API Gateway configuration."""
import os

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://user-service:8001")
ITINERARY_SERVICE_URL = os.environ.get(
    "ITINERARY_SERVICE_URL", "http://itinerary-service:8002"
)
RECOMMENDATION_SERVICE_URL = os.environ.get(
    "RECOMMENDATION_SERVICE_URL", "http://recommendation-service:8003"
)
