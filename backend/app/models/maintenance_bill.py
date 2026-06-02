from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.fiscal_year import FiscalYear
    from app.models.payment import Payment
    from app.models.user import User


class MaintenanceBill(Base):
    """One row per (member, fiscal_year). plot_no is denormalised for display
    (e.g. "1 & 2") and matches the ledger image."""

    __tablename__ = "maintenance_bills"
    __table_args__ = (
        UniqueConstraint("member_id", "fiscal_year_id", name="uq_bills_member_fy"),
        CheckConstraint("payable_amount >= 0", name="payable_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    member_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fiscal_year_id: Mapped[int] = mapped_column(
        ForeignKey("fiscal_years.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    plot_no: Mapped[str] = mapped_column(String(40), nullable=False)
    payable_amount: Mapped[int] = mapped_column(Numeric(12, 2), nullable=False)

    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    member: Mapped["User"] = relationship(back_populates="bills", foreign_keys=[member_id])
    fiscal_year: Mapped["FiscalYear"] = relationship(back_populates="bills")
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="bill", cascade="all, delete-orphan", order_by="Payment.paid_on.desc()"
    )
