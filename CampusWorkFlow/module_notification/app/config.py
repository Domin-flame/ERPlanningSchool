"""Configuration du service Notification."""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://campus_user:campus_pass@localhost:5432/notification_db"
)
JWT_SECRET    = os.getenv("JWT_SECRET",   "dev-secret-change-me")
if os.getenv("APP_ENV", "development").lower() == "production" and (
    len(JWT_SECRET) < 32
    or any(marker in JWT_SECRET.lower() for marker in ("dev-secret", "change-me", "replace", "example", "sample", "local-dev"))
):
    raise RuntimeError("Production requires a JWT_SECRET with at least 32 characters.")
JWT_ALGORITHM = "HS256"
RABBITMQ_URL  = os.getenv("RABBITMQ_URL", "amqp://campus_rabbit:rabbit_pass@localhost:5672/")
REDIS_URL     = os.getenv("REDIS_URL",    "redis://localhost:6379/2")

# Exchange RabbitMQ sur lequel les autres services publient leurs événements
EXCHANGE_NAME = "campus.events"
QUEUE_NAME    = "notification.events"
