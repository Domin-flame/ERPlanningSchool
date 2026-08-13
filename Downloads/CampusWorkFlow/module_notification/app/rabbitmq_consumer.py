"""
Consumer RabbitMQ du service Notification.

Écoute l'exchange `campus.events` (topic) sur la queue `notification.events`.
Crée une notification en base pour chaque événement reçu.

Routing keys reconnues :
  academic.course.created   → notification pour tous les étudiants (message générique)
  finance.invoice.created   → notification pour l'étudiant concerné
  finance.payment.confirmed → notification de confirmation de paiement
  hr.leave.approved         → notification pour l'employé concerné
  hr.leave.rejected         → notification de refus
  auth.password.reset       → notification interne (log only)

Format attendu du message JSON :
{
  "user_id": 42,          # destinataire (int) — requis
  "title": "...",         # titre (str) — requis
  "message": "...",       # corps (str) — requis
  "type": "info",         # info | success | warning | error
  "category": "system"    # academic | finance | hr | system
}
"""
import asyncio
import json
import logging

import aio_pika

from app.config import EXCHANGE_NAME, QUEUE_NAME, RABBITMQ_URL
from app.database import SessionLocal
from app.models import Notification

logger = logging.getLogger(__name__)


async def _handle_message(message: aio_pika.IncomingMessage) -> None:
    async with message.process(requeue=False):
        try:
            body = json.loads(message.body.decode("utf-8"))
            user_id = body.get("user_id")
            title   = body.get("title", "Notification")
            text    = body.get("message", "")
            ntype   = body.get("type", "info")
            cat     = body.get("category", "system")

            if not user_id:
                logger.warning("[NOTIF-CONSUMER] user_id manquant — ignoré : %s", body)
                return

            db = SessionLocal()
            try:
                notif = Notification(
                    user_id=int(user_id),
                    title=title,
                    message=text,
                    type=ntype,
                    category=cat,
                )
                db.add(notif)
                db.commit()
                logger.info("[NOTIF-CONSUMER] Notification créée pour user %s : %s", user_id, title)
            finally:
                db.close()

        except Exception as exc:
            logger.error("[NOTIF-CONSUMER] Erreur traitement message : %s", exc)


async def start_consumer() -> None:
    """Démarre le consumer en boucle avec reconnexion automatique."""
    retry_delay = 5
    while True:
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=10)

            exchange = await channel.declare_exchange(
                EXCHANGE_NAME,
                aio_pika.ExchangeType.TOPIC,
                durable=True,
            )
            queue = await channel.declare_queue(QUEUE_NAME, durable=True)

            # Binding sur tous les événements campus
            await queue.bind(exchange, routing_key="#")

            logger.info("[NOTIF-CONSUMER] Connecté à RabbitMQ — en écoute sur '%s'", QUEUE_NAME)
            retry_delay = 5  # reset après connexion réussie

            await queue.consume(_handle_message)
            await asyncio.Future()  # bloquer indéfiniment

        except Exception as exc:
            logger.error("[NOTIF-CONSUMER] Déconnecté : %s — reconnexion dans %ss", exc, retry_delay)
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 60)
