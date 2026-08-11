"""RecommendationService configuration."""
import os

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://user-service:8001")
ITINERARY_SERVICE_URL = os.environ.get(
    "ITINERARY_SERVICE_URL", "http://itinerary-service:8002"
)
RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

USER_EXCHANGE = "user.events"
ITINERARY_EXCHANGE = "itinerary.events"
