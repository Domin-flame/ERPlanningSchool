"""
Producteur d'événements RabbitMQ du service Académique.

Workflow asynchrone demandé par le cahier des charges :
  "un étudiant s'inscrit à une offre de cours" -> Service A (academic-service)
  publie un événement `academic.enrollment.created` sur l'exchange topic
  `campus.events`. Le service Finance (Service B) l'écoute et crée
  automatiquement une facture, SANS que ce service n'attende de réponse.

Principe :
  - Le endpoint HTTP academic-service répond immédiatement après avoir
    committé l'inscription en base (source de vérité).
  - La publication RabbitMQ se fait ensuite, via `BackgroundTasks` de
    FastAPI, donc APRÈS que la réponse HTTP soit déjà repartie vers le
    client : l'appelant ne patiente jamais pour le traitement du service
    Finance (découplage temporel total, cf. §"Check your system's safety
    and speed" -> la latence perçue de POST /enrollments/ ne dépend pas
    de la durée du traitement du consumer Finance).
  - En cas d'échec RabbitMQ (broker indisponible, etc.), l'inscription
    reste valide : on logge l'erreur sans jamais faire échouer la requête
    HTTP déjà répondue (résilience : la donnée métier prime).
"""
import json
import logging

import pika

from app.config import settings

logger = logging.getLogger(__name__)

EXCHANGE_NAME = "campus.events"


def _publish(routing_key: str, payload: dict) -> None:
    """Publication bloquante mais volontairement isolée dans une tâche de
    fond FastAPI (`BackgroundTasks`) — voir docstring du module. Ouvre une
    connexion courte durée à chaque appel : suffisant pour le volume
    d'événements métiers de ce service (inscriptions, créations d'étudiants),
    pas fait pour du haut débit (auquel cas on garderait une connexion
    persistante comme dans module_message / module_notification)."""
    try:
        params = pika.URLParameters(settings.RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=json.dumps(payload, default=str).encode("utf-8"),
            properties=pika.BasicProperties(delivery_mode=2, content_type="application/json"),
        )
        connection.close()
        logger.info("[ACADEMIC-PRODUCER] Événement publié : %s -> %s", routing_key, payload)
    except Exception as exc:  # pragma: no cover - dépend de l'infra RabbitMQ
        logger.error("[ACADEMIC-PRODUCER] Échec publication '%s' : %s", routing_key, exc)


def publish_student_created(student_id: int, user_id: int, matricule: str, full_name: str) -> None:
    _publish(
        "academic.student.created",
        {
            "id_student": student_id,
            "id_person": user_id,
            "matricule": matricule,
            "nom_complet": full_name,
        },
    )


def publish_enrollment_created(
    enrollment_id: int,
    student_id: int,
    user_id: int,
    matricule: str,
    full_name: str,
    course_offering_id: int,
    course_code: str,
    course_title: str,
    credits: int,
) -> None:
    """Événement central du workflow asynchrone demandé :
    "a student enrolls" -> Finance "create an invoice"."""
    _publish(
        "academic.enrollment.created",
        {
            "enrollment_id": enrollment_id,
            "student": {
                "id_student": student_id,
                "id_person": user_id,
                "matricule": matricule,
                "nom_complet": full_name,
            },
            "course_offering_id": course_offering_id,
            "course_code": course_code,
            "course_title": course_title,
            "credits": credits,
        },
    )
