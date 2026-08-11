"""
RecommendationService RabbitMQ consumer.

Consumes user & itinerary events asynchronously to maintain an in-memory
cache of user preferences and destinations, reducing synchronous calls.
"""
import asyncio
import json

import aio_pika

from app.config import RABBITMQ_URL, USER_EXCHANGE, ITINERARY_EXCHANGE

# In-memory caches
USER_PREFERENCES = {}        # username -> [prefs]
DESTINATIONS_CACHE = []      # list of destination dicts


class EventConsumer:
    def __init__(self):
        self._connection = None
        self._started = False

    async def _declare_and_bind(self, channel, exchange_name, queue_name,
                                routing_keys):
        exchange = await channel.declare_exchange(
            exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )
        queue = await channel.declare_queue(queue_name, durable=True)
        for key in routing_keys:
            await queue.bind(exchange, routing_key=key)
        return queue

    async def _on_user_event(self, message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                body = json.loads(message.body)
                username = body.get("username")
                if username:
                    USER_PREFERENCES[username] = body.get("preferences", [])
                    print(f"[consumer] user event -> {username}: "
                          f"{body.get('preferences')}")
            except Exception as exc:
                print(f"[consumer] user event error: {exc}")

    async def _on_itinerary_event(self, message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                body = json.loads(message.body)
                print(f"[consumer] itinerary event: "
                      f"{body.get('event', message.routing_key)}")
            except Exception as exc:
                print(f"[consumer] itinerary event error: {exc}")

    async def start(self):
        if self._started:
            return
        self._started = True
        for attempt in range(30):
            try:
                self._connection = await aio_pika.connect_robust(RABBITMQ_URL)
                channel = await self._connection.channel()
                await channel.set_qos(prefetch_count=10)

                # user.events
                user_queue = await self._declare_and_bind(
                    channel, USER_EXCHANGE, "recommendations.user",
                    ["user.registered", "user.preferences.updated"],
                )
                await user_queue.consume(self._on_user_event)

                # itinerary.events
                it_queue = await self._declare_and_bind(
                    channel, ITINERARY_EXCHANGE, "recommendations.itinerary",
                    ["itinerary.created", "itinerary.deleted"],
                )
                await it_queue.consume(self._on_itinerary_event)

                print("[consumer] connected to RabbitMQ")
                return
            except Exception as exc:  # pragma: no cover
                print(f"[consumer] retry {attempt}: {exc}")
                await asyncio.sleep(3)


consumer = EventConsumer()


async def start_consumer():
    await consumer.start()
