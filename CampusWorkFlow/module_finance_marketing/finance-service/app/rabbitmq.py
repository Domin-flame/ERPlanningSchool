"""
Service Finance — bout "consumer" du workflow asynchrone RabbitMQ.

Événement métier choisi (cahier des charges) :
    "a student enrolls"  ->  "create an invoice" (automatiquement)

Flux complet :
  1. academic-service (Service A) publie `academic.enrollment.created` sur
     l'exchange topic `campus.events` dès qu'une inscription est créée, puis
     répond immédiatement à son appelant HTTP (voir module_academique/app/events.py).
  2. finance-service (Service B, ce fichier) consomme cet événement de façon
     totalement découplée : academic-service ne sait pas si/quand Finance
     traite le message, et n'attend jamais sa réponse.
  3. Pour chaque événement reçu, on :
       a. met à jour le cache local `student_ref` (lecture seule, alimenté
          uniquement par ces événements — plus d'endpoint manuel nécessaire) ;
       b. crée automatiquement une facture (Invoice + InvoiceLine) pour les
          frais de scolarité du cours suivi ;
       c. republie un événement `finance.invoice.created`, consommé à son
          tour par notification-service pour prévenir l'étudiant.
  4. Idempotence : le numéro de facture est dérivé de l'`enrollment_id`
     (`FAC-ENR-<id>`), donc un même événement re-livré (ex: reconnexion
     RabbitMQ) ne crée jamais de facture en double.
"""
import asyncio
import json
import logging
import os
from datetime import date, datetime, timedelta
from decimal import Decimal

import aio_pika
from sqlalchemy import text
from sqlmodel import Session, select

from .database import engine
from .models import Invoice, InvoiceLine, StudentRef

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://campus_rabbit:rabbit_pass@localhost:5672/")
EXCHANGE_NAME = "campus.events"
QUEUE_NAME = "finance.academic_events"

# Montant facturé par crédit ECTS — variable d'environnement pour rester
# ajustable sans redéploiement de code (règle de gestion simple mais réelle).
PRICE_PER_CREDIT = Decimal(os.getenv("FINANCE_PRICE_PER_CREDIT", "15000"))
INVOICE_DUE_DAYS = int(os.getenv("FINANCE_INVOICE_DUE_DAYS", "30"))

_connection: aio_pika.RobustConnection | None = None
_channel: aio_pika.abc.AbstractChannel | None = None


async def _get_channel() -> aio_pika.abc.AbstractChannel:
    global _connection, _channel
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(RABBITMQ_URL)
        _channel = await _connection.channel()
    return _channel


async def publish_invoice_created(user_id: int, numero_facture: str, montant: Decimal) -> None:
    """Notifie le service Notification qu'une facture vient d'être émise."""
    try:
        channel = await _get_channel()
        exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True)
        payload = {
            "user_id": user_id,
            "title": "Nouvelle facture émise",
            "message": f"La facture {numero_facture} d'un montant de {montant} XAF a été générée suite à votre inscription.",
            "type": "info",
            "category": "finance",
        }
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload, default=str).encode("utf-8"),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key="finance.invoice.created",
        )
        logger.info("[FINANCE-PRODUCER] finance.invoice.created publié pour user %s (%s)", user_id, numero_facture)
    except Exception as exc:
        logger.error("[FINANCE-PRODUCER] Échec publication finance.invoice.created : %s", exc)


def _upsert_student_ref(session: Session, student: dict) -> None:
    existing = session.get(StudentRef, student["id_student"])
    if existing:
        existing.id_person = student["id_person"]
        existing.matricule = student["matricule"]
        existing.nom_complet_cache = student["nom_complet"]
        existing.synced_at = datetime.utcnow()
        session.add(existing)
    else:
        session.add(
            StudentRef(
                id_student=student["id_student"],
                id_person=student["id_person"],
                matricule=student["matricule"],
                nom_complet_cache=student["nom_complet"],
            )
        )
    session.commit()


async def _handle_student_created(body: dict) -> None:
    with Session(engine) as session:
        if session.get_bind().dialect.name == "postgresql":
            session.exec(text("SET app.current_roles = 'finance_admin'"))
        _upsert_student_ref(session, body)
    logger.info("[FINANCE-CONSUMER] student_ref synchronisé pour l'étudiant %s", body.get("id_student"))


async def _handle_enrollment_created(body: dict) -> None:
    enrollment_id = body["enrollment_id"]
    student = body["student"]
    credits = int(body.get("credits") or 0)
    course_code = body.get("course_code", "N/A")
    course_title = body.get("course_title", "Cours")

    numero_facture = f"FAC-ENR-{enrollment_id}"

    with Session(engine) as session:
        if session.get_bind().dialect.name == "postgresql":
            session.exec(text("SET app.current_roles = 'finance_admin'"))

        # 1) Cache étudiant à jour (idempotent, upsert)
        _upsert_student_ref(session, student)

        # 2) Idempotence : ne jamais dupliquer la facture d'une même inscription
        existing_invoice = session.exec(
            select(Invoice).where(Invoice.numero_facture == numero_facture)
        ).first()
        if existing_invoice:
            logger.info(
                "[FINANCE-CONSUMER] Facture %s déjà existante pour l'inscription %s — événement ignoré",
                numero_facture, enrollment_id,
            )
            return

        montant_ligne = PRICE_PER_CREDIT * max(credits, 1)
        today = date.today()
        invoice = Invoice(
            numero_facture=numero_facture,
            date_emission=today,
            date_echeance=today + timedelta(days=INVOICE_DUE_DAYS),
            montant_total=montant_ligne,
            statut="EMISE",
            id_student=student["id_student"],
        )
        session.add(invoice)
        session.commit()
        session.refresh(invoice)

        session.add(
            InvoiceLine(
                description=f"Frais de scolarité — {course_code} {course_title} ({credits} crédits)",
                quantite=1,
                prix_unitaire=montant_ligne,
                id_invoice=invoice.id_invoice,
            )
        )
        session.commit()

        logger.info(
            "[FINANCE-CONSUMER] Facture %s créée automatiquement pour l'étudiant %s (inscription %s) — %s XAF",
            numero_facture, student["id_student"], enrollment_id, montant_ligne,
        )

    # 3) Notifier l'étudiant (encore un événement asynchrone, sans bloquer)
    await publish_invoice_created(student["id_person"], numero_facture, montant_ligne)


async def _handle_message(message: aio_pika.IncomingMessage) -> None:
    async with message.process(requeue=False):
        try:
            body = json.loads(message.body.decode("utf-8"))
            routing_key = message.routing_key or ""

            if routing_key == "academic.student.created":
                await _handle_student_created(body)
            elif routing_key == "academic.enrollment.created":
                await _handle_enrollment_created(body)
            else:
                logger.debug("[FINANCE-CONSUMER] Routing key ignorée : %s", routing_key)
        except Exception as exc:
            logger.error("[FINANCE-CONSUMER] Erreur traitement message (%s) : %s", message.routing_key, exc)


async def start_consumer() -> None:
    """Boucle de consommation avec reconnexion automatique (mêmes garanties
    que notification-service) — tourne en tâche de fond FastAPI."""
    retry_delay = 5
    while True:
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=10)

            exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True)
            queue = await channel.declare_queue(QUEUE_NAME, durable=True)

            # Le service Finance ne s'intéresse qu'aux événements du module académique
            await queue.bind(exchange, routing_key="academic.student.created")
            await queue.bind(exchange, routing_key="academic.enrollment.created")

            logger.info("[FINANCE-CONSUMER] Connecté à RabbitMQ — en écoute sur '%s'", QUEUE_NAME)
            retry_delay = 5

            await queue.consume(_handle_message)
            await asyncio.Future()

        except Exception as exc:
            logger.error("[FINANCE-CONSUMER] Déconnecté : %s — reconnexion dans %ss", exc, retry_delay)
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 60)
