import asyncio
import json
import logging
import os

from jose import jwt, JWTError
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.rabbitmq_consumer import start_consumer
from app.config import JWT_SECRET, JWT_ALGORITHM
from app.routers import notifications

logger = logging.getLogger(__name__)
# Schema management is delegated to Alembic migrations. If migrations exist
# and `DB_AUTO_INIT=true` is set, attempt to run them at startup.
try:
    if os.getenv("DB_AUTO_INIT", "false").lower() == "true":
        import subprocess

        subprocess.run(["alembic", "-c", "migrations/alembic.ini", "upgrade", "head"], check=False)
except Exception:
    pass

app = FastAPI(
    title="CampusWorkflow — Notification Service",
    version="2.0.0",
    description="Notifications temps réel via WebSocket + consumer RabbitMQ",
)

_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://gateway:3000,http://localhost:5173",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications.router)


# ── WebSocket push ────────────────────────────────────────────
# Dictionnaire user_id → liste de WebSockets actifs
_ws_connections: dict[int, list[WebSocket]] = {}


async def broadcast_to_user(user_id: int, payload: dict) -> None:
    sockets = _ws_connections.get(user_id, [])
    dead = []
    for ws in sockets:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            dead.append(ws)
    for ws in dead:
        sockets.remove(ws)


@app.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket):
    """
    WebSocket pour les notifications temps réel.
    Le client se connecte avec son user_id après authentification.
    Le gateway doit vérifier le token avant d'autoriser la connexion.
    """
    # Validate JWT from Authorization header to deduce user identity
    auth = websocket.headers.get("authorization") or websocket.headers.get("sec-websocket-protocol")
    if not auth:
        await websocket.close(code=1008)
        return
    if auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
    else:
        token = auth
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        await websocket.close(code=1008)
        return
    user_id = payload.get("user_id") or payload.get("sub")
    await websocket.accept()
    _ws_connections.setdefault(user_id, []).append(websocket)
    logger.info("[WS] user %s connecté (%d sockets actifs)", user_id, len(_ws_connections[user_id]))

    try:
        while True:
            # Maintenir la connexion — le client peut envoyer "ping"
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        sockets = _ws_connections.get(user_id, [])
        if websocket in sockets:
            sockets.remove(websocket)
        logger.info("[WS] user %s déconnecté", user_id)


# ── Lifecycle ─────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    # Démarrer le consumer RabbitMQ en tâche de fond
    asyncio.create_task(start_consumer())
    logger.info("[NOTIFICATION SERVICE] Démarré — consumer RabbitMQ en tâche de fond")


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "service": "notification-service"}
