"""
scripts/seed_finance.py — Peuple finance-service avec des données de
démonstration cohérentes, via les modèles SQLModel réels de l'app
(app/models.py) plutôt qu'un script SQL brut incompatible — voir
docs/BUG_TRACKING.md #16.

Usage :
  docker compose exec finance-service python scripts/seed_finance.py
"""
from datetime import date, datetime
from decimal import Decimal

from sqlmodel import Session, select

from app.database import engine
from app.models import Campaign, Invoice, InvoiceLine, Lead, Payment, StudentRef


def run():
    with Session(engine) as db:
        if db.exec(select(StudentRef)).first():
            print("[seed_finance] Des données existent déjà — rien à faire.")
            return

        student = StudentRef(
            id_student=1,
            id_person=1,
            matricule="ETU2026-001",
            nom_complet_cache="Jean Mballa",
        )
        db.add(student)
        db.flush()

        invoice = Invoice(
            numero_facture="FAC-2026-0001",
            date_emission=date(2026, 9, 5),
            date_echeance=date(2026, 10, 5),
            montant_total=Decimal("150000"),
            statut="EMISE",
            id_student=student.id_student,
        )
        db.add(invoice)
        db.flush()

        db.add(
            InvoiceLine(
                description="Frais de scolarité — Semestre 1",
                quantite=1,
                prix_unitaire=Decimal("150000"),
                id_invoice=invoice.id_invoice,
            )
        )

        payment = Payment(
            montant=Decimal("150000"),
            date_paiement=datetime(2026, 9, 10),
            methode="MTN_MOMO",
            reference="MOMO-DEMO0001",
            id_invoice=invoice.id_invoice,
            statut="CONFIRME",
        )
        db.add(payment)

        campaign = Campaign(
            nom="Rentrée académique 2026",
            canal="SOCIAL",
            date_debut=date(2026, 8, 1),
            date_fin=date(2026, 9, 30),
            budget=Decimal("500000"),
        )
        db.add(campaign)
        db.flush()

        db.add(
            Lead(
                nom="Prospect Démo",
                contact="+237600000001",
                source="Facebook Ads",
                statut="CONTACTE",
                id_campaign=campaign.id_campaign,
            )
        )

        db.commit()
        print("[seed_finance] Données de démonstration créées avec succès.")


if __name__ == "__main__":
    run()
