from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod


class FiscalYearOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    start_year: int
    start_date: date
    end_date: date


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: Decimal
    paid_on: date
    method: PaymentMethod
    reference: Optional[str]
    note: Optional[str]
    recorded_by_name: Optional[str] = None
    created_at: datetime


class MaintenanceBillRow(BaseModel):
    """The shape rendered in the FY ledger table."""

    bill_id: int
    member_id: int
    member_name: str
    plot_no: str
    house: Optional[str]
    mobile: str

    fiscal_year_id: int
    fiscal_year_label: str

    payable_amount: Decimal
    received_amount: Decimal
    closing_balance: Decimal
    status: Literal["Cleared", "Pending"]

    last_payment_on: Optional[date] = None
    last_payment_amount: Optional[Decimal] = None


class MaintenanceLedgerResponse(BaseModel):
    fiscal_year: FiscalYearOut
    rows: list[MaintenanceBillRow]
    totals: "LedgerTotals"


class LedgerTotals(BaseModel):
    total_payable: Decimal
    total_received: Decimal
    total_closing: Decimal
    cleared_count: int
    pending_count: int
    member_count: int


class RecordPaymentRequest(BaseModel):
    bill_id: int = Field(gt=0)
    amount: Decimal = Field(gt=Decimal("0"))
    paid_on: date
    method: PaymentMethod = PaymentMethod.bank
    reference: Optional[str] = Field(default=None, max_length=80)
    note: Optional[str] = Field(default=None, max_length=200)


class AssignMaintenanceRequest(BaseModel):
    bill_ids: list[int] = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    from_date: date
    to_date: date


class AssignMaintenanceResponse(BaseModel):
    updated_count: int
    fiscal_year: FiscalYearOut
    rows: list[MaintenanceBillRow]
    totals: "LedgerTotals"


class BillDetail(BaseModel):
    bill: MaintenanceBillRow
    payments: list[PaymentOut]


MaintenanceLedgerResponse.model_rebuild()
AssignMaintenanceResponse.model_rebuild()
