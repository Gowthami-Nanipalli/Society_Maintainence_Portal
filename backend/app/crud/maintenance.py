from datetime import date
from decimal import Decimal
from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.models.fiscal_year import FiscalYear
from app.models.maintenance_bill import MaintenanceBill
from app.models.payment import Payment
from app.models.user import User, UserRole, UserStatus
from app.schemas.maintenance import (
    LedgerTotals,
    MaintenanceBillRow,
)


def _fy_label(start_year: int) -> str:
    return f"FY {start_year % 100:02d}/{(start_year + 1) % 100:02d}"


def get_or_create_fiscal_year(db: Session, start_year: int) -> FiscalYear:
    fy = db.scalar(select(FiscalYear).where(FiscalYear.start_year == start_year))
    if fy:
        return fy
    fy = FiscalYear(
        start_year=start_year,
        label=_fy_label(start_year),
        start_date=date(start_year, 4, 1),
        end_date=date(start_year + 1, 3, 31),
    )
    db.add(fy)
    db.flush()
    return fy


def current_fy_start_year(today: date | None = None) -> int:
    """Indian FY starts April 1. Anything before April belongs to the previous FY."""
    today = today or date.today()
    return today.year if today.month >= 4 else today.year - 1


def current_fiscal_year(db: Session) -> FiscalYear:
    return get_or_create_fiscal_year(db, current_fy_start_year())


def ensure_bills_for_active_members(db: Session, fy: FiscalYear) -> None:
    """Make sure every active community member + officer who owns a plot has
    a bill row for the given FY. Idempotent."""

    settings = get_settings()

    existing_member_ids = set(
        db.scalars(
            select(MaintenanceBill.member_id).where(MaintenanceBill.fiscal_year_id == fy.id)
        ).all()
    )

    members = db.scalars(
        select(User)
        .where(User.status == UserStatus.active)
        .where(User.role == UserRole.community_member)
        .where(User.plot_no.is_not(None))
    ).all()

    new_count = 0
    for m in members:
        if m.id in existing_member_ids:
            continue
        bill = MaintenanceBill(
            member_id=m.id,
            fiscal_year_id=fy.id,
            plot_no=m.plot_no or "",
            payable_amount=Decimal(settings.DEFAULT_ANNUAL_MAINTENANCE),
        )
        db.add(bill)
        new_count += 1
    if new_count:
        db.flush()


def ledger_rows(db: Session, fy: FiscalYear) -> tuple[list[MaintenanceBillRow], LedgerTotals]:
    received_subq = (
        select(
            Payment.bill_id.label("bill_id"),
            func.coalesce(func.sum(Payment.amount), 0).label("received"),
            func.max(Payment.paid_on).label("last_paid_on"),
        )
        .group_by(Payment.bill_id)
        .subquery()
    )

    stmt = (
        select(
            MaintenanceBill,
            User,
            func.coalesce(received_subq.c.received, 0).label("received_amount"),
            received_subq.c.last_paid_on.label("last_paid_on"),
        )
        .join(User, MaintenanceBill.member_id == User.id)
        .outerjoin(received_subq, received_subq.c.bill_id == MaintenanceBill.id)
        .where(MaintenanceBill.fiscal_year_id == fy.id)
        .order_by(MaintenanceBill.plot_no.asc(), User.name.asc())
    )

    rows: list[MaintenanceBillRow] = []
    total_payable = Decimal("0")
    total_received = Decimal("0")
    cleared = 0
    pending = 0

    for bill, member, received_amount, last_paid_on in db.execute(stmt).all():
        payable = Decimal(bill.payable_amount)
        received = Decimal(received_amount)
        closing = payable - received
        if closing < 0:
            closing = Decimal("0")
        is_cleared = received >= payable
        status_label = "Cleared" if is_cleared else "Pending"

        last_amount: Decimal | None = None
        if last_paid_on is not None:
            last_payment = db.scalar(
                select(Payment)
                .where(Payment.bill_id == bill.id, Payment.paid_on == last_paid_on)
                .order_by(Payment.created_at.desc())
                .limit(1)
            )
            last_amount = Decimal(last_payment.amount) if last_payment else None

        rows.append(
            MaintenanceBillRow(
                bill_id=bill.id,
                member_id=member.id,
                member_name=member.name,
                plot_no=bill.plot_no,
                house=member.house,
                mobile=member.mobile,
                fiscal_year_id=fy.id,
                fiscal_year_label=fy.label,
                payable_amount=payable,
                received_amount=received,
                closing_balance=closing,
                status=status_label,
                last_payment_on=last_paid_on,
                last_payment_amount=last_amount,
            )
        )
        total_payable += payable
        total_received += received
        if is_cleared:
            cleared += 1
        else:
            pending += 1

    totals = LedgerTotals(
        total_payable=total_payable,
        total_received=total_received,
        total_closing=max(total_payable - total_received, Decimal("0")),
        cleared_count=cleared,
        pending_count=pending,
        member_count=len(rows),
    )
    return rows, totals


def bill_with_member(db: Session, bill_id: int) -> tuple[MaintenanceBill, User] | None:
    row = db.execute(
        select(MaintenanceBill, User)
        .join(User, MaintenanceBill.member_id == User.id)
        .where(MaintenanceBill.id == bill_id)
        .options(joinedload(MaintenanceBill.fiscal_year))
    ).first()
    return (row[0], row[1]) if row else None


def total_received_for(db: Session, bill_id: int) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.bill_id == bill_id)
    )
    return Decimal(total or 0)


def payments_for(db: Session, bill_id: int) -> Iterable[Payment]:
    return db.scalars(
        select(Payment).where(Payment.bill_id == bill_id).order_by(Payment.paid_on.desc())
    ).all()
