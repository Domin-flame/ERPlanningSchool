from datetime import date
from sqlmodel import Field, SQLModel


class FeeStructure(SQLModel, table=True):
    __tablename__ = "fee_structure"

    fee_structure_id: int | None = Field(default=None, primary_key=True)
    academic_year: str
    tuition_amount: float


class Invoice(SQLModel, table=True):
    __tablename__ = "invoice"

    invoice_id: int | None = Field(default=None, primary_key=True)
    issue_date: date
    due_date: date
    status: str
    fee_structure_id: int | None = Field(default=None, foreign_key="fee_structure.fee_structure_id")
    student_id: int = Field(foreign_key="student.student_id", index=True)  # recherche fréquente : factures d'un étudiant


class InvoiceItem(SQLModel, table=True):
    __tablename__ = "invoice_item"

    invoice_item_id: int | None = Field(default=None, primary_key=True)
    description: str
    amount: float
    invoice_id: int = Field(foreign_key="invoice.invoice_id", index=True)


class Payment(SQLModel, table=True):
    __tablename__ = "payment"

    payment_id: int | None = Field(default=None, primary_key=True)
    amount_paid: float
    payment_date: date
    payment_method: str
    transaction_ref: str = Field(index=True, unique=True)  # recherche par référence de transaction
    invoice_id: int = Field(foreign_key="invoice.invoice_id", index=True)  # recherche des paiements d'une facture


class Scholarship(SQLModel, table=True):
    __tablename__ = "scholarship"

    scholarship_id: int | None = Field(default=None, primary_key=True)
    title: str
    discount_percentage: float
    type: str


class StudentScholarship(SQLModel, table=True):
    __tablename__ = "student_scholarship"

    student_scholarship_id: int | None = Field(default=None, primary_key=True)
    academic_year: str
    approved_by: str
    student_id: int = Field(foreign_key="student.student_id", index=True)
    scholarship_id: int = Field(foreign_key="scholarship.scholarship_id", index=True)


class Campaign(SQLModel, table=True):
    __tablename__ = "campaign"

    campaign_id: int | None = Field(default=None, primary_key=True)
    name: str
    channel: str
    start_date: date
    end_date: date
    budget: float


class Lead(SQLModel, table=True):
    __tablename__ = "lead"

    lead_id: int | None = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(index=True, unique=True)  # recherche fréquente par email
    phone: str
    status: str
    approved_to: str
    campaign_id: int = Field(foreign_key="campaign.campaign_id", index=True)


class Budget(SQLModel, table=True):
    __tablename__ = "budget"

    budget_id: int | None = Field(default=None, primary_key=True)
    fiscal_year: str
    allocated_amount: float


class ExpenseRequest(SQLModel, table=True):
    __tablename__ = "expense_request"

    expense_request_id: int | None = Field(default=None, primary_key=True)
    amount: float
    status: str
    approved_by: str
    budget_id: int = Field(foreign_key="budget.budget_id", index=True)  # recherche des dépenses d'un budget