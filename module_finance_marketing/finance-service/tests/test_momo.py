"""
Tests unitaires du simulateur MoMo (MTN Mobile Money / Orange Money).

Ces fonctions sont pures (pas de DB, pas de réseau), ce qui en fait le
candidat le plus sûr et le plus rapide pour une suite de tests unitaires
sur ce microservice — le reste du service dépend de PostgreSQL avec RLS
et de colonnes générées, ce qui nécessite un vrai Postgres pour être
testé de bout en bout (voir Status.md / README du service).
"""
import asyncio
import re

import pytest

from app.momo import auto_confirm_after_delay, generate_reference, initiate_payment


def test_generate_reference_mtn_has_momo_prefix():
    ref = generate_reference("MTN_MOMO")
    assert ref.startswith("MOMO-")
    assert re.fullmatch(r"MOMO-[0-9A-F]{10}", ref)


def test_generate_reference_orange_has_om_prefix():
    ref = generate_reference("ORANGE_MONEY")
    assert ref.startswith("OM-")
    assert re.fullmatch(r"OM-[0-9A-F]{10}", ref)


def test_generate_reference_is_unique_across_calls():
    refs = {generate_reference("MTN_MOMO") for _ in range(50)}
    assert len(refs) == 50  # aucune collision sur 50 générations


def test_initiate_payment_returns_pending_status():
    result = initiate_payment("MTN_MOMO", "+237650000000", 25000)
    assert result["statut"] == "EN_ATTENTE"
    assert result["methode"] == "MTN_MOMO"
    assert result["numero_telephone"] == "+237650000000"
    assert result["montant"] == 25000
    assert result["reference"].startswith("MOMO-")
    assert "initiated_at" in result


def test_initiate_payment_orange_money_reference_prefix():
    result = initiate_payment("ORANGE_MONEY", "+237690000000", 10000)
    assert result["reference"].startswith("OM-")
    assert result["statut"] == "EN_ATTENTE"


def test_auto_confirm_after_delay_invokes_callback_with_reference():
    """Le webhook simulé doit finir par confirmer le paiement (même flux
    qu'un vrai callback MoMo/Orange, mais après un court délai simulé)."""
    received = []

    def _callback(reference):
        received.append(reference)

    asyncio.run(auto_confirm_after_delay("MOMO-TESTREF01", _callback, delay_seconds=0))

    assert received == ["MOMO-TESTREF01"]


@pytest.mark.parametrize("methode", ["MTN_MOMO", "ORANGE_MONEY"])
def test_initiate_payment_never_returns_confirmed_status_immediately(methode):
    """Sécurité métier : un paiement MoMo ne doit JAMAIS être considéré
    comme confirmé avant la confirmation asynchrone (webhook / callback)."""
    result = initiate_payment(methode, "+237600000000", 5000)
    assert result["statut"] != "CONFIRME"
