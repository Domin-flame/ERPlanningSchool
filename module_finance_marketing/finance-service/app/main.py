from decimal import Decimal
from typing import Optional
import os

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Header
from sqlmodel import Session, SQLModel, select

from . import momo
from .database import engine, get_session
from .models import (
    Campaign,
    CampaignCreate,
    Invoice,
    InvoiceCreate,
    InvoiceLine,
    Lead,
    LeadCreate,
    MomoPaymentInitiate,
    Payment,
    StudentRef,
)

app = FastAPI(
    title="Finance & Marketing Service",
    description="Microservice ERP — facturation, paiements MoMo, campagnes marketing",
    version="1.0.0",
)


@app.on_event("startup")
def on_startup():
    # Par défaut la base est créée par les scripts SQL fournis (production/test).
    # N'activer create_all() que si DB_AUTO_INIT=true (utile pour dev isolé).
    db_auto_init = os.getenv("DB_AUTO_INIT", "false").lower()
    if db_auto_init in ("1", "true", "yes"):
        SQLModel.metadata.create_all(engine)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "finance-marketing"}


def get_session_with_auth(
    session: Session = Depends(get_session),
    authorization: Optional[str] = Header(None)
):
    """
    Wrapper pour extraire le token JWT du header Authorization
    et configurer le contexte RLS.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        from .database import set_rls_context
        set_rls_context(session, token)
    return session


# ---------------------------------------------------------------------------
# Étudiants (cache local — normalement alimenté par un consumer d'événements
# academic.student.events en Semaine 4 ; endpoint manuel en attendant)
# ---------------------------------------------------------------------------
@app.post("/student-ref", tags=["student_ref"])
def upsert_student_ref(student: StudentRef, session: Session = Depends(get_session_with_auth)):
    """
    À REMPLACER en Semaine 4 par un consumer RabbitMQ qui écoute les
    événements publiés par academic-service. En attendant, permet de
    peupler manuellement le cache pour développer/tester ce service
    de façon indépendante.
    """
    existing = session.get(StudentRef, student.id_student)
    if existing:
        existing.id_person = student.id_person
        existing.matricule = student.matricule
        existing.nom_complet_cache = student.nom_complet_cache
        session.add(existing)
    else:
        session.add(student)
    session.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Facturation
# ---------------------------------------------------------------------------
@app.post("/invoices", tags=["invoices"], status_code=201)
def create_invoice(payload: InvoiceCreate, session: Session = Depends(get_session_with_auth)):
    student = session.get(StudentRef, payload.id_student)
    if not student:
        raise HTTPException(404, "Étudiant introuvable dans le cache finance (student_ref)")

    montant_total = sum(l.quantite * l.prix_unitaire for l in payload.lignes)
    numero_facture = f"FAC-{payload.id_student}-{payload.date_echeance.isoformat().replace('-', '')}"

    invoice = Invoice(
        numero_facture=numero_facture,
        date_emission=__import__("datetime").date.today(),
        date_echeance=payload.date_echeance,
        montant_total=montant_total,
        statut="EMISE",
        id_student=payload.id_student,
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)

    for ligne in payload.lignes:
        session.add(
            InvoiceLine(
                description=ligne.description,
                quantite=ligne.quantite,
                prix_unitaire=ligne.prix_unitaire,
                id_invoice=invoice.id_invoice,
            )
        )
    session.commit()
    session.refresh(invoice)
    return invoice


@app.get("/invoices/{invoice_id}", tags=["invoices"])
def get_invoice(invoice_id: int, session: Session = Depends(get_session_with_auth)):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Facture introuvable")
    lignes = session.exec(select(InvoiceLine).where(InvoiceLine.id_invoice == invoice_id)).all()
    return {"invoice": invoice, "lignes": lignes}


@app.get("/students/{student_id}/invoices", tags=["invoices"])
def list_invoices_for_student(student_id: int, session: Session = Depends(get_session_with_auth)):
    """Utile pour la démo Semaine 2/3 : EXPLAIN ANALYZE tourne sur idx_invoice_student."""
    return session.exec(select(Invoice).where(Invoice.id_student == student_id)).all()


# ---------------------------------------------------------------------------
# Paiements MoMo (simulés — voir app/momo.py pour le point d'extension)
# ---------------------------------------------------------------------------
@app.post("/payments/momo/initiate", tags=["payments"], status_code=201)
def initiate_momo_payment(
    payload: MomoPaymentInitiate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session_with_auth),
):
    invoice = session.get(Invoice, payload.id_invoice)
    if not invoice:
        raise HTTPException(404, "Facture introuvable")
    if payload.methode not in ("MTN_MOMO", "ORANGE_MONEY"):
        raise HTTPException(400, "Méthode doit être MTN_MOMO ou ORANGE_MONEY")

    result = momo.initiate_payment(payload.methode, payload.numero_telephone, payload.montant)

    payment = Payment(
        montant=payload.montant,
        methode=payload.methode,
        reference=result["reference"],
        id_invoice=payload.id_invoice,
        statut="pending",
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)

    # Simule la confirmation webhook 5s plus tard (pratique pour une démo live)
    background_tasks.add_task(
        _schedule_auto_confirm, result["reference"]
    )

    return {"payment": payment, "message": "Paiement initié — en attente de confirmation MoMo"}


def _schedule_auto_confirm(reference: str):
    import asyncio

    asyncio.run(momo.auto_confirm_after_delay(reference, _confirm_payment_sync, delay_seconds=5))


def _confirm_payment_sync(reference: str):
    """Exécuté par la tâche de fond — ouvre sa propre session DB."""
    from .database import engine

    with Session(engine) as session:
        payment = session.exec(select(Payment).where(Payment.reference == reference)).first()
        if not payment or payment.statut != "pending":
            return
        _apply_confirmed_payment(session, payment)


@app.post("/payments/momo/confirm/{reference}", tags=["payments"])
def confirm_momo_payment_manual(reference: str, session: Session = Depends(get_session_with_auth)):
    """
    Endpoint manuel équivalent au webhook — utile pour la démo à
    l'oral (déclencher la confirmation à la demande plutôt que
    d'attendre le délai simulé).
    """
    payment = session.exec(select(Payment).where(Payment.reference == reference)).first()
    if not payment:
        raise HTTPException(404, "Paiement introuvable")
    if payment.statut != "pending":
        raise HTTPException(400, f"Paiement déjà au statut {payment.statut}")

    _apply_confirmed_payment(session, payment)
    session.refresh(payment)
    return payment


def _apply_confirmed_payment(session: Session, payment: Payment):
    """
    Transaction ACID : confirmer un paiement ET mettre à jour la
    facture associée doivent réussir ou échouer ensemble — c'est le
    point que le commentaire du schéma SQL demande explicitement de
    démontrer à l'examinateur.
    """
    payment.statut = "confirmed"
    session.add(payment)

    invoice = session.get(Invoice, payment.id_invoice)
    total_paye = session.exec(
        select(Payment).where(Payment.id_invoice == invoice.id_invoice, Payment.statut == "confirmed")
    ).all()
    montant_paye = sum(p.montant for p in total_paye) + payment.montant

    if montant_paye >= invoice.montant_total:
        invoice.statut = "PAYEE"
    else:
        invoice.statut = "PARTIELLEMENT_PAYEE"
    session.add(invoice)

    session.commit()  # les deux updates valident/échouent ensemble


@app.get("/payments/{reference}", tags=["payments"])
def get_payment_status(reference: str, session: Session = Depends(get_session_with_auth)):
    payment = session.exec(select(Payment).where(Payment.reference == reference)).first()
    if not payment:
        raise HTTPException(404, "Paiement introuvable")
    return payment


# ---------------------------------------------------------------------------
# Marketing
# ---------------------------------------------------------------------------
@app.post("/campaigns", tags=["marketing"], status_code=201)
def create_campaign(payload: CampaignCreate, session: Session = Depends(get_session_with_auth)):
    campaign = Campaign(**payload.model_dump())
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign


@app.get("/campaigns", tags=["marketing"])
def list_campaigns(session: Session = Depends(get_session_with_auth)):
    return session.exec(select(Campaign)).all()


@app.post("/leads", tags=["marketing"], status_code=201)
def create_lead(payload: LeadCreate, session: Session = Depends(get_session_with_auth)):
    lead = Lead(**payload.model_dump())
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@app.get("/campaigns/{campaign_id}/leads", tags=["marketing"])
def list_leads_for_campaign(campaign_id: int, session: Session = Depends(get_session_with_auth)):
    return session.exec(select(Lead).where(Lead.id_campaign == campaign_id)).all()


@app.get("/", tags=["health"])
def health():
    return {"service": "finance-marketing", "status": "ok"}