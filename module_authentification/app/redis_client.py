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


# ── Verrouillage de compte après échecs de connexion répétés ───
#
# Mitigation OWASP API2:2023 (Broken Authentication) : sans ce garde-fou,
# un attaquant peut tester des mots de passe indéfiniment sur un compte
# ciblé (brute force / credential stuffing). Le compte est verrouillé
# temporairement après MAX_FAILED_ATTEMPTS échecs consécutifs, dans une
# fenêtre glissante de FAILED_ATTEMPTS_WINDOW_SECONDS.

FAILED_ATTEMPTS_PREFIX = "cw:auth:failed:"
LOCKOUT_PREFIX = "cw:auth:locked:"

MAX_FAILED_ATTEMPTS = 5
FAILED_ATTEMPTS_WINDOW_SECONDS = 15 * 60  # 15 minutes
LOCKOUT_DURATION_SECONDS = 15 * 60        # 15 minutes


def record_failed_login(email: str) -> int:
    """Incrémente le compteur d'échecs de connexion pour cet email et renvoie
    le nouveau total. Le compteur expire tout seul après une fenêtre
    d'inactivité (pas de nettoyage manuel nécessaire)."""
    r = get_redis()
    key = f"{FAILED_ATTEMPTS_PREFIX}{email.lower()}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, FAILED_ATTEMPTS_WINDOW_SECONDS)
    return count


def clear_failed_login(email: str) -> None:
    """Réinitialise le compteur d'échecs après une connexion réussie."""
    r = get_redis()
    r.delete(f"{FAILED_ATTEMPTS_PREFIX}{email.lower()}")


def lock_account(email: str, ttl_seconds: int = LOCKOUT_DURATION_SECONDS) -> None:
    r = get_redis()
    r.setex(f"{LOCKOUT_PREFIX}{email.lower()}", ttl_seconds, "1")


def get_lock_ttl(email: str) -> int:
    """Renvoie le nombre de secondes restantes avant déverrouillage du
    compte, ou 0 si le compte n'est pas verrouillé."""
    r = get_redis()
    ttl = r.ttl(f"{LOCKOUT_PREFIX}{email.lower()}")
    return ttl if ttl and ttl > 0 else 0


# ── Rotation des refresh tokens ─────────────────────────────────
#
# Chaque refresh token porte un identifiant unique ("jti"). Dès qu'il est
# utilisé sur /auth/refresh, on le marque "consommé" avec un TTL égal à sa
# durée de vie restante : toute nouvelle tentative de réutiliser le MÊME
# refresh token (ex: token volé et rejoué) est donc rejetée, alors qu'un
# refresh token légitime nouvellement émis reste valide. C'est la "rotation
# réelle" — l'ancien refresh token est révoqué dès qu'un nouveau est délivré.

REFRESH_USED_PREFIX = "cw:refresh:used:"


def is_refresh_jti_used(jti: str) -> bool:
    r = get_redis()
    return r.exists(f"{REFRESH_USED_PREFIX}{jti}") == 1


def mark_refresh_jti_used(jti: str, ttl_seconds: int) -> None:
    r = get_redis()
    r.setex(f"{REFRESH_USED_PREFIX}{jti}", max(int(ttl_seconds), 1), "1")
