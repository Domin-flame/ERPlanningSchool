"""
Ces classes reflètent le schéma déjà défini dans
database/finance-service/init/01_schema.sql — elles ne recréent PAS
les tables (pas de create_all ici), elles servent juste à l'ORM pour
lire/écrire dans les tables déjà créées par le script SQL, qui contient
des contraintes (CHECK, colonnes GENERATED) que SQLModel ne saurait pas
reproduire correctement.
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Column, Computed, Numeric
from sqlmodel import Field, SQLModel


# --- Cache en lecture seule, alimenté (plus tard) par un consumer d'événements ---
class StudentRef(SQLModel, table=True):
    __tablename__ = "student_ref"

    id_student: int = Field(primary_key=True)
    id_person: int
    matricule: str
    nom_complet_cache: str
    synced_at: datetime = Field(default_factory=datetime.utcnow)


# --- Facturation ---
class Invoice(SQLModel, table=True):
    __tablename__ = "invoice"

    id_invoice: int | None = Field(default=None, primary_key=True)
    numero_facture: str = Field(unique=True)
    date_emission: date
    date_echeance: date
    montant_total: Decimal = Field(default=0)
    statut: str = Field(default="EMISE")  # EMISE, PARTIELLEMENT_PAYEE, PAYEE, EN_RETARD, ANNULEE
    id_student: int = Field(foreign_key="student_ref.id_student", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InvoiceLine(SQLModel, table=True):
    __tablename__ = "invoice_line"

    id_line: int | None = Field(default=None, primary_key=True)
    description: str
    quantite: int = Field(default=1)
    prix_unitaire: Decimal
    # `montant` est une colonne GENERATED ALWAYS AS (quantite * prix_unitaire)
    # côté PostgreSQL. Computed(...) dit à SQLAlchemy de NE JAMAIS l'inclure
    # dans les INSERT/UPDATE — Postgres la calcule lui-même. On peut quand
    # même la lire normalement après un refresh().
    montant: Decimal | None = Field(
        default=None,
        sa_column=Column(Numeric, Computed("quantite * prix_unitaire", persisted=True)),
    )
    id_invoice: int = Field(foreign_key="invoice.id_invoice", index=True)


class Payment(SQLModel, table=True):
    __tablename__ = "payment"

    id_payment: int | None = Field(default=None, primary_key=True)
    montant: Decimal
    date_paiement: datetime = Field(default_factory=datetime.utcnow)
    methode: str  # MTN_MOMO, ORANGE_MONEY, CARTE, VIREMENT, ESPECES
    reference: str = Field(unique=True, index=True)
    id_invoice: int = Field(foreign_key="invoice.id_invoice", index=True)
    # Colonne ajoutée côté app pour gérer le flux MoMo asynchrone
    # (le schéma SQL de base n'a pas de statut sur payment ; à faire valider
    # avec l'équipe avant de migrer le script SQL si vous la gardez)
    statut: str = Field(default="EN_ATTENTE")  # EN_ATTENTE, CONFIRME, ECHEC


class Receipt(SQLModel, table=True):
    __tablename__ = "receipt"

    id_receipt: int | None = Field(default=None, primary_key=True)
    numero_recu: str = Field(unique=True)
    date_emission: datetime = Field(default_factory=datetime.utcnow)
    id_payment: int = Field(foreign_key="payment.id_payment", unique=True)


# --- Marketing ---
class Campaign(SQLModel, table=True):
    __tablename__ = "campaign"

    id_campaign: int | None = Field(default=None, primary_key=True)
    nom: str
    canal: str  # SOCIAL, EMAIL, RADIO, EVENT...
    date_debut: date
    date_fin: date | None = None
    budget: Decimal = Field(default=0)


class Lead(SQLModel, table=True):
    __tablename__ = "lead"

    id_lead: int | None = Field(default=None, primary_key=True)
    nom: str
    contact: str
    source: str | None = None
    statut: str = Field(default="NOUVEAU")  # NOUVEAU, CONTACTE, QUALIFIE, CONVERTI, PERDU
    date_conversion: date | None = None
    id_campaign: int | None = Field(default=None, foreign_key="campaign.id_campaign", index=True)


# --- Schémas d'entrée (validation des requêtes, pas des tables) ---
class InvoiceLineCreate(SQLModel):
    description: str
    quantite: int = 1
    prix_unitaire: Decimal


class InvoiceCreate(SQLModel):
    id_student: int
    date_echeance: date
    lignes: list[InvoiceLineCreate]


class MomoPaymentInitiate(SQLModel):
    id_invoice: int
    montant: Decimal
    methode: str  # "MTN_MOMO" ou "ORANGE_MONEY"
    numero_telephone: str  # numéro qui reçoit la demande de paiement


class CampaignCreate(SQLModel):
    nom: str
    canal: str
    date_debut: date
    date_fin: date | None = None
    budget: Decimal = 0


class LeadCreate(SQLModel):
    nom: str
    contact: str
    source: str | None = None
    id_campaign: int | None = None