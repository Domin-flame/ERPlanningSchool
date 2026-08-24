import json
import logging
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import conversations, messages

logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusWorkflow — Message Service",
    version="2.0.0",
    description="Messagerie interne avec WebSocket temps réel",
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

app.include_router(conversations.router)
app.include_router(messages.router)

# ── WebSocket push ─────────────────────────────────────────────
# conversation_id → liste de WebSockets actifs
_chat_sockets: dict[str, list[WebSocket]] = {}


async def broadcast_to_conversation(conversation_id: str, payload: dict) -> None:
    sockets = _chat_sockets.get(conversation_id, [])
    dead = []
    for ws in sockets:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            dead.append(ws)
    for ws in dead:
        sockets.remove(ws)


# Expose la fonction pour que les routers puissent l'utiliser
app.state.broadcast = broadcast_to_conversation


@app.websocket("/ws/messages/{conversation_id}")
async def ws_chat(websocket: WebSocket, conversation_id: str):
    """
    WebSocket pour la messagerie temps réel dans une conversation.
    Les messages envoyés via POST /api/v1/messages/ sont broadcastés ici.
    """
    await websocket.accept()
    _chat_sockets.setdefault(conversation_id, []).append(websocket)
    logger.info("[WS-CHAT] Connexion à la conversation %s", conversation_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        sockets = _chat_sockets.get(conversation_id, [])
        if websocket in sockets:
            sockets.remove(websocket)
        logger.info("[WS-CHAT] Déconnexion de la conversation %s", conversation_id)


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "service": "message-service"}
