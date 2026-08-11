"""
ItineraryService RabbitMQ publisher.

Publishes itinerary-domain events to the "itinerary.events" exchange.
"""
import os
import json

import aio_pika

RABBITMQ_URL = os.environ.get(
    "RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/"
)
EXCHANGE = "itinerary.events"


class EventPublisher:
    def __init__(self):
        self._connection = None
        self._channel = None
        self._exchange = None

    async def connect(self):
        if self._connection is None or self._connection.is_closed:
            self._connection = await aio_pika.connect_robust(RABBITMQ_URL)
        if self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
        self._exchange = await self._channel.declare_exchange(
            EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True
        )

    async def publish(self, event_type: str, payload: dict):
        try:
            await self.connect()
            message = aio_pika.Message(
                body=json.dumps(payload, default=str).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            await self._exchange.publish(message, routing_key=event_type)
        except Exception as exc:  # pragma: no cover
            print(f"[rabbitmq] publish failed for {event_type}: {exc}")

    async def close(self):
        if self._connection and not self._connection.is_closed:
            await self._connection.close()


publisher = EventPublisher()


async def publish_itinerary_created(username: str, itinerary_id: str,
                                    destinations: list):
    await publisher.publish("itinerary.created", {
        "username": username,
        "itinerary_id": itinerary_id,
        "destinations": destinations,
    })


async def publish_itinerary_deleted(username: str, itinerary_id: str):
    await publisher.publish("itinerary.deleted", {
        "username": username,
        "itinerary_id": itinerary_id,
    })
