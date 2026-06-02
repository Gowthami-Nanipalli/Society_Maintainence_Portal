from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_current_user, require_treasurer
from app.crud.maintenance import (
    bill_with_member,
    current_fiscal_year,
    ensure_bills_for_active_members,
    get_or_create_fiscal_year,
    ledger_rows,
    payments_for,
    total_received_for,
)
from app.db.session import get_db
from app.models.fiscal_year import FiscalYear
from app.models.maintenance_bill import MaintenanceBill
from app.models.payment import Payment
from app.models.user import User
from app.schemas.maintenance import (
    AssignMaintenanceRequest,
    AssignMaintenanceResponse,
    BillDetail,
    FiscalYearOut,
    MaintenanceBillRow,
    MaintenanceLedgerResponse,
    PaymentOut,
    RecordPaymentRequest,
)


router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/fiscal-years", response_model=list[FiscalYearOut])
def list_fiscal_years(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FiscalYearOut]:
    rows = db.scalars(select(FiscalYear).order_by(FiscalYear.start_year.desc())).all()
    return [FiscalYearOut.model_validate(r) for r in rows]


@router.get("/ledger", response_model=MaintenanceLedgerResponse)
def ledger(
    fy_start_year: int | None = Query(default=None),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MaintenanceLedgerResponse:
    fy = (
        get_or_create_fiscal_year(db, fy_start_year)
        if fy_start_year is not None
        else current_fiscal_year(db)
    )
    ensure_bills_for_active_members(db, fy)
    db.commit()

    rows, totals = ledger_rows(db, fy)
    return MaintenanceLedgerResponse(
        fiscal_year=FiscalYearOut.model_validate(fy),
        rows=rows,
        totals=totals,
    )


@router.get("/bills/{bill_id}", response_model=BillDetail)
def bill_detail(
    bill_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillDetail:
    found = bill_with_member(db, bill_id)
    if not found:
        raise HTTPException(status_code=404, detail="Bill not found.")
    bill, member = found

    payments = list(payments_for(db, bill_id))
    received = total_received_for(db, bill_id)
    payable = Decimal(bill.payable_amount)
    closing = payable - received
    if closing < Decimal("0"):
        closing = Decimal("0")
    status_label = "Cleared" if received >= payable else "Pending"

    last_payment = payments[0] if payments else None

    row = MaintenanceBillRow(
        bill_id=bill.id,
        member_id=member.id,
        member_name=member.name,
        plot_no=bill.plot_no,
        house=member.house,
        mobile=member.mobile,
        fiscal_year_id=bill.fiscal_year_id,
        fiscal_year_label=bill.fiscal_year.label,
        payable_amount=payable,
        received_amount=received,
        closing_balance=closing,
        status=status_label,
        last_payment_on=last_payment.paid_on if last_payment else None,
        last_payment_amount=Decimal(last_payment.amount) if last_payment else None,
    )

    payment_outs: list[PaymentOut] = []
    for p in payments:
        po = PaymentOut.model_validate(p)
        if p.recorded_by is not None:
            po = po.model_copy(update={"recorded_by_name": p.recorded_by.name})
        payment_outs.append(po)

    return BillDetail(bill=row, payments=payment_outs)


@router.post("/payments", response_model=BillDetail, status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: RecordPaymentRequest,
    actor: User = Depends(require_treasurer),
    db: Session = Depends(get_db),
) -> BillDetail:
    found = bill_with_member(db, payload.bill_id)
    if not found:
        raise HTTPException(status_code=404, detail="Bill not found.")
    bill, member = found

    already_received = total_received_for(db, bill.id)
    payable = Decimal(bill.payable_amount)
    remaining = payable - already_received
    if remaining <= Decimal("0"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This bill is already fully cleared.",
        )
    if payload.amount > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Amount {payload.amount} exceeds outstanding balance {remaining}."
            ),
        )

    payment = Payment(
        bill_id=bill.id,
        amount=payload.amount,
        paid_on=payload.paid_on,
        method=payload.method,
        reference=payload.reference,
        note=payload.note,
        recorded_by_id=actor.id,
    )
    db.add(payment)
    db.flush()

    record_audit(
        db,
        actor=actor,
        action="payment_recorded",
        entity_type="payment",
        entity_id=payment.id,
        summary=(
            f"Treasurer {actor.name} recorded {payload.amount} for "
            f"{member.name} (bill #{bill.id}, plot {bill.plot_no})."
        ),
        payload={
            "bill_id": bill.id,
            "member_id": member.id,
            "amount": str(payload.amount),
            "method": payload.method.value,
            "paid_on": payload.paid_on.isoformat(),
            "reference": payload.reference,
        },
    )
    db.commit()
    return bill_detail(bill.id, actor, db)


@router.post(
    "/assign",
    response_model=AssignMaintenanceResponse,
    status_code=status.HTTP_200_OK,
)
def assign_maintenance(
    payload: AssignMaintenanceRequest,
    actor: User = Depends(require_treasurer),
    db: Session = Depends(get_db),
) -> AssignMaintenanceResponse:
    if payload.from_date > payload.to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="From-date cannot be after To-date.",
        )

    bills = db.scalars(
        select(MaintenanceBill).where(MaintenanceBill.id.in_(payload.bill_ids))
    ).all()
    if not bills:
        raise HTTPException(status_code=404, detail="No matching bills found.")

    # All selected bills must belong to a single FY so the returned ledger view
    # is internally consistent.
    fy_ids = {b.fiscal_year_id for b in bills}
    if len(fy_ids) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected bills span multiple fiscal years.",
        )
    fy = db.get(FiscalYear, next(iter(fy_ids)))
    if fy is None:
        raise HTTPException(status_code=404, detail="Fiscal year not found.")

    for bill in bills:
        bill.payable_amount = Decimal(bill.payable_amount) + payload.amount

    record_audit(
        db,
        actor=actor,
        action="maintenance_assigned",
        entity_type="maintenance_bill",
        entity_id=None,
        summary=(
            f"Treasurer {actor.name} assigned {payload.amount} to "
            f"{len(bills)} bill(s) for {payload.from_date}..{payload.to_date}."
        ),
        payload={
            "bill_ids": [b.id for b in bills],
            "amount": str(payload.amount),
            "from_date": payload.from_date.isoformat(),
            "to_date": payload.to_date.isoformat(),
        },
    )
    db.commit()

    rows, totals = ledger_rows(db, fy)
    return AssignMaintenanceResponse(
        updated_count=len(bills),
        fiscal_year=FiscalYearOut.model_validate(fy),
        rows=rows,
        totals=totals,
    )
