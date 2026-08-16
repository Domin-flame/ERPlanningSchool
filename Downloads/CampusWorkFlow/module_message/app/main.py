import json
import logging
import os

from jose import jwt, JWTError
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import JWT_SECRET, JWT_ALGORITHM
from app.routers import conversations, messages

logger = logging.getLogger(__name__)

# Schema management is handled by Alembic migrations. Optionally run
# migrations at startup when DB_AUTO_INIT=true and migrations are present.
try:
    if os.getenv("DB_AUTO_INIT", "false").lower() == "true":
        import subprocess

        subprocess.run(["alembic", "-c", "migrations/alembic.ini", "upgrade", "head"], check=False)
except Exception:
    pass

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
# conversation_id → liste de dict {user_id, websocket}
_chat_sockets: dict[str, list[dict]] = {}


async def broadcast_to_conversation(conversation_id: str, payload: dict) -> None:
    sockets = _chat_sockets.get(conversation_id, [])
    dead = []
    for entry in list(sockets):
        ws = entry.get("ws")
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            dead.append(entry)
    for entry in dead:
        if entry in sockets:
            sockets.remove(entry)


# Expose la fonction pour que les routers puissent l'utiliser
app.state.broadcast = broadcast_to_conversation


@app.websocket("/ws/messages/{conversation_id}")
async def ws_chat(websocket: WebSocket, conversation_id: str):
    """
    WebSocket pour la messagerie temps réel dans une conversation.
    Le client doit fournir un JWT lors du handshake soit via l'en-tête
    `Authorization: Bearer <token>` (proxy interne) soit en envoyant le
    token brut comme `Sec-WebSocket-Protocol` (navigateur).
    """
    auth = websocket.headers.get("authorization") or websocket.headers.get("sec-websocket-protocol")
    if not auth:
        await websocket.close(code=1008)
        return
    # support both "Bearer <token>" and raw token presented via subprotocol
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
    _chat_sockets.setdefault(conversation_id, []).append({"user_id": user_id, "ws": websocket})
    logger.info("[WS-CHAT] Connexion user=%s à la conversation %s", user_id, conversation_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        sockets = _chat_sockets.get(conversation_id, [])
        # remove the entry matching websocket
        to_remove = None
        for entry in sockets:
            if entry.get("ws") is websocket:
                to_remove = entry
                break
        if to_remove:
            sockets.remove(to_remove)
        logger.info("[WS-CHAT] Déconnexion user=%s de la conversation %s", user_id, conversation_id)


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "service": "message-service"}
