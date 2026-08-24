"""Configuration du service Message."""
import os

DATABASE_URL  = os.getenv("DATABASE_URL",  "postgresql://campus_user:campus_pass@localhost:5432/message_db")
JWT_SECRET    = os.getenv("JWT_SECRET",    "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
RABBITMQ_URL  = os.getenv("RABBITMQ_URL",  "amqp://campus_rabbit:rabbit_pass@localhost:5672/")
REDIS_URL     = os.getenv("REDIS_URL",     "redis://localhost:6379/1")

EXCHANGE_NAME = "campus.events"
