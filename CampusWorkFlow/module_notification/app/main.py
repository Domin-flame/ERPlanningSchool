import asyncio
import logging
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app import realtime
from app.auth import decode_token
from app.database import Base, engine
from sqlalchemy import text
from app.rabbitmq_consumer import start_consumer
from app.routers import notifications

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)
if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE"))

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
@app.websocket("/ws/notifications/{user_id}")
async def ws_notifications(websocket: WebSocket, user_id: int, token: str | None = None):
    """
    WebSocket pour les notifications temps réel.
    Le client transmet son access token (`?token=`) ; la connexion est
    refusée si le jeton est invalide ou ne correspond pas à `user_id`.
    """
    current = decode_token(token)
    if current is None or current.user_id is None or int(current.user_id) != user_id:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    realtime.register(user_id, websocket)
    logger.info("[WS] user %s connecté (%d sockets actifs)", user_id, len(realtime.connections.get(user_id, [])))

    try:
        while True:
            # Maintenir la connexion — le client peut envoyer "ping"
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        realtime.unregister(user_id, websocket)
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
