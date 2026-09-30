"""
Registre des WebSockets actifs du service Notification.

Partagé entre l'endpoint WebSocket (main.py), le consumer RabbitMQ et
l'API REST pour pousser chaque nouvelle notification en temps réel.
"""
import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# user_id → liste de WebSockets actifs
connections: dict[int, list[WebSocket]] = {}


def register(user_id: int, websocket: WebSocket) -> None:
    connections.setdefault(user_id, []).append(websocket)


def unregister(user_id: int, websocket: WebSocket) -> None:
    sockets = connections.get(user_id, [])
    if websocket in sockets:
        sockets.remove(websocket)
    if not sockets:
        connections.pop(user_id, None)


async def broadcast_to_user(user_id: int, payload: dict) -> None:
    sockets = list(connections.get(user_id, []))
    for ws in sockets:
        try:
            await ws.send_text(json.dumps(payload, default=str))
        except Exception:
            unregister(user_id, ws)


def notification_event(notif) -> dict:
    return {
        "type": "notification",
        "id": str(notif.id),
        "title": notif.title,
        "message": notif.message,
        "notification_type": notif.type,
        "category": notif.category,
        "created_at": notif.created_at.isoformat() if notif.created_at else None,
    }
