"""
Client Redis partagé pour le service Auth.

Usages :
  - Blacklist des access tokens révoqués au logout
  - Stockage des tokens de reset de mot de passe (TTL 1h)
"""
import os
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Pool de connexions synchrone (compatible avec FastAPI sync handlers)
_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=_pool)


# ── Blacklist ────────────────────────────────────────────────

BLACKLIST_PREFIX = "cw:blacklist:"


def blacklist_token(token: str, ttl_seconds: int) -> None:
    """Ajoute un access token révoqué dans Redis avec un TTL égal à sa durée de vie restante."""
    r = get_redis()
    r.setex(f"{BLACKLIST_PREFIX}{token}", ttl_seconds, "1")


def is_token_blacklisted(token: str) -> bool:
    r = get_redis()
    return r.exists(f"{BLACKLIST_PREFIX}{token}") == 1


# ── Reset de mot de passe ────────────────────────────────────

RESET_PREFIX = "cw:reset:"
RESET_TTL = 3600  # 1 heure


def store_reset_token(email: str, token: str) -> None:
    """Stocke le token de reset (clé = token → valeur = email) avec TTL 1h."""
    r = get_redis()
    r.setex(f"{RESET_PREFIX}{token}", RESET_TTL, email)


def get_reset_email(token: str) -> str | None:
    """Retourne l'email associé à un token de reset, ou None s'il est expiré/invalide."""
    r = get_redis()
    return r.get(f"{RESET_PREFIX}{token}")


def delete_reset_token(token: str) -> None:
    r = get_redis()
    r.delete(f"{RESET_PREFIX}{token}")
