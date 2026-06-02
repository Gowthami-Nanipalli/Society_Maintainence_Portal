from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.maintenance_bill import MaintenanceBill
    from app.models.user import User


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank = "bank"
    upi = "upi"
    cheque = "cheque"
    other = "other"


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (CheckConstraint("amount > 0", name="amount_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)

    bill_id: Mapped[int] = mapped_column(
        ForeignKey("maintenance_bills.id", ondelete="CASCADE"), nullable=False, index=True
    )

    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    paid_on: Mapped[date] = mapped_column(Date, nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method", native_enum=False, length=16),
        nullable=False,
        default=PaymentMethod.bank,
    )
    reference: Mapped[str | None] = mapped_column(String(80), nullable=True)
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)

    recorded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    bill: Mapped["MaintenanceBill"] = relationship(back_populates="payments")
    recorded_by: Mapped["User | None"] = relationship(
        back_populates="payments_recorded", foreign_keys=[recorded_by_id]
    )
