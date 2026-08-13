"""
Producer RabbitMQ du service Message.

Publie un événement sur l'exchange `campus.events` chaque fois
qu'un nouveau message est envoyé, pour que le service Notification
puisse créer une notification pour le destinataire.
"""
import asyncio
import json
import logging

import aio_pika

from app.config import EXCHANGE_NAME, RABBITMQ_URL

logger = logging.getLogger(__name__)
_connection: aio_pika.RobustConnection | None = None
_channel:    aio_pika.Channel | None = None


async def _get_channel() -> aio_pika.Channel:
    global _connection, _channel
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(RABBITMQ_URL)
        _channel = await _connection.channel()
    return _channel


async def publish_message_event(
    recipient_user_id: int,
    sender_name: str,
    conversation_name: str,
    preview: str,
) -> None:
    """
    Publie un événement `message.sent` pour notifier le destinataire.
    """
    try:
        channel = await _get_channel()
        exchange = await channel.declare_exchange(
            EXCHANGE_NAME,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )
        payload = {
            "user_id":  recipient_user_id,
            "title":    f"Nouveau message de {sender_name}",
            "message":  preview[:100] if preview else "Vous avez reçu un nouveau message",
            "type":     "info",
            "category": "system",
        }
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload).encode("utf-8"),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key="message.sent",
        )
        logger.debug("[MSG-PRODUCER] Événement publié pour user %s", recipient_user_id)
    except Exception as exc:
        logger.error("[MSG-PRODUCER] Échec publication : %s", exc)
