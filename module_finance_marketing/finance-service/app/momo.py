"""
Simulation d'une intégration MoMo (MTN Mobile Money / Orange Money).

Pourquoi un mock plutôt qu'une vraie API pour l'examen ?
----------------------------------------------------------
Les vraies API MTN MoMo / Orange Money nécessitent un compte marchand,
des identifiants sandbox obtenus après inscription (souvent plusieurs
jours de délai), et un webhook accessible publiquement (donc un tunnel
ngrok ou un déploiement réel) pour recevoir la confirmation. Pas
réaliste dans le calendrier d'un exam de 6 semaines.

Ce module reproduit le MÊME flux qu'une vraie intégration :
  1. initiate_payment()  -> le service génère une référence, renvoie
     "en attente" (comme une vraie requête MoMo le ferait pendant que
     l'utilisateur confirme sur son téléphone).
  2. Un webhook (simulé ici par un endpoint /payments/momo/confirm
     appelé manuellement, ou par confirm_payment_after_delay() en
     tâche de fond) vient ensuite marquer le paiement comme confirmé.

Pour brancher une vraie API plus tard, il suffira de remplacer le corps
de initiate_payment() par un appel HTTP réel (ex: requests.post vers
l'endpoint MTN MoMo "requesttopay"), et de remplacer l'endpoint
/payments/momo/confirm par le VRAI webhook que MTN/Orange appellent
automatiquement — la logique métier (mise à jour Invoice/Payment dans
une transaction) reste identique.
"""

import asyncio
import uuid
from datetime import datetime


def generate_reference(methode: str) -> str:
    prefix = "MOMO" if methode == "MTN_MOMO" else "OM"
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


def initiate_payment(methode: str, numero_telephone: str, montant) -> dict:
    """
    Simule l'appel à l'API du fournisseur MoMo : renvoie immédiatement
    une référence de transaction et un statut "EN_ATTENTE", comme le
    ferait une vraie API pendant que l'utilisateur valide sur son
    téléphone (code USSD / notification push).
    """
    reference = generate_reference(methode)
    return {
        "reference": reference,
        "statut": "EN_ATTENTE",
        "methode": methode,
        "numero_telephone": numero_telephone,
        "montant": montant,
        "initiated_at": datetime.utcnow().isoformat(),
    }


async def auto_confirm_after_delay(reference: str, confirm_callback, delay_seconds: int = 5):
    """
    Simule la confirmation asynchrone qu'un vrai fournisseur MoMo
    enverrait via webhook quelques secondes après que l'utilisateur ait
    validé sur son téléphone. Utile pour une démo live : on initie le
    paiement, on montre le statut "EN_ATTENTE", puis quelques secondes
    plus tard le statut passe automatiquement à "CONFIRME" sans action
    manuelle supplémentaire.
    """
    await asyncio.sleep(delay_seconds)
    confirm_callback(reference)