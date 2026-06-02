from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.maintenance_bill import MaintenanceBill


class FiscalYear(Base):
    """Indian financial year, e.g. "FY 25/26" runs 2025-04-01..2026-03-31."""

    __tablename__ = "fiscal_years"
    __table_args__ = (
        UniqueConstraint("label", name="uq_fiscal_years_label"),
        UniqueConstraint("start_year", name="uq_fiscal_years_start_year"),
        CheckConstraint("end_date > start_date", name="fy_dates_ordered"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(16), nullable=False)  # e.g. "FY 25/26"
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)  # 2025
    start_date: Mapped[date] = mapped_column(Date, nullable=False)  # 2025-04-01
    end_date: Mapped[date] = mapped_column(Date, nullable=False)  # 2026-03-31

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    bills: Mapped[list["MaintenanceBill"]] = relationship(
        back_populates="fiscal_year", cascade="all, delete-orphan"
    )
