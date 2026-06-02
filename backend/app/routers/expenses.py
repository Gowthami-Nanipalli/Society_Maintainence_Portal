from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_current_user, require_treasurer
from app.db.session import get_db
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import CATEGORIES, ExpenseCreate, ExpenseOut, ExpenseTotals


router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ExpenseOut]:
    rows = db.scalars(select(Expense).order_by(Expense.spent_on.desc(), Expense.id.desc())).all()
    out: list[ExpenseOut] = []
    for e in rows:
        creator_name = None
        if e.created_by_id is not None:
            user = db.get(User, e.created_by_id)
            creator_name = user.name if user else None
        out.append(
            ExpenseOut(
                id=e.id,
                spent_on=e.spent_on,
                category=e.category,
                description=e.description,
                amount=e.amount,
                created_by_name=creator_name,
                created_at=e.created_at,
            )
        )
    return out


@router.get("/totals", response_model=ExpenseTotals)
def totals(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExpenseTotals:
    rows = db.execute(
        select(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
        .group_by(Expense.category)
    ).all()
    by_cat = {cat: Decimal(amount) for cat, amount in rows}
    total = sum(by_cat.values(), Decimal("0"))
    count = db.scalar(select(func.count(Expense.id))) or 0
    return ExpenseTotals(total=total, by_category=by_cat, count=count)


@router.get("/categories", response_model=list[str])
def list_categories(_: User = Depends(get_current_user)) -> list[str]:
    return list(CATEGORIES)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def add_expense(
    payload: ExpenseCreate,
    actor: User = Depends(require_treasurer),
    db: Session = Depends(get_db),
) -> ExpenseOut:
    expense = Expense(
        spent_on=payload.spent_on,
        category=payload.category,
        description=payload.description,
        amount=payload.amount,
        created_by_id=actor.id,
    )
    db.add(expense)
    db.flush()

    record_audit(
        db,
        actor=actor,
        action="expense_added",
        entity_type="expense",
        entity_id=expense.id,
        summary=(
            f"Treasurer {actor.name} recorded {payload.amount} expense "
            f"({payload.category}: {payload.description})."
        ),
        payload={
            "spent_on": payload.spent_on.isoformat(),
            "category": payload.category,
            "amount": str(payload.amount),
        },
    )
    db.commit()
    db.refresh(expense)
    return ExpenseOut(
        id=expense.id,
        spent_on=expense.spent_on,
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        created_by_name=actor.name,
        created_at=expense.created_at,
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    actor: User = Depends(require_treasurer),
    db: Session = Depends(get_db),
) -> None:
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    snapshot = {
        "id": expense.id,
        "spent_on": expense.spent_on.isoformat(),
        "category": expense.category,
        "description": expense.description,
        "amount": str(expense.amount),
    }
    db.delete(expense)
    db.flush()

    record_audit(
        db,
        actor=actor,
        action="expense_deleted",
        entity_type="expense",
        entity_id=expense_id,
        summary=f"Treasurer {actor.name} deleted expense #{expense_id}.",
        payload=snapshot,
    )
    db.commit()
    return None
