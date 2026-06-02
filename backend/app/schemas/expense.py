from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


CATEGORIES = (
    "Security",
    "Electricity",
    "Housekeeping",
    "Plumbing",
    "Gardening",
    "Repairs",
    "Water",
    "Other",
)


class ExpenseCreate(BaseModel):
    spent_on: date
    category: str = Field(min_length=1, max_length=40)
    description: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=Decimal("0"))

    @field_validator("category")
    @classmethod
    def _category(cls, v: str) -> str:
        v = v.strip()
        if v not in CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(CATEGORIES)}.")
        return v


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    spent_on: date
    category: str
    description: str
    amount: Decimal
    created_by_name: Optional[str] = None
    created_at: datetime


class ExpenseTotals(BaseModel):
    total: Decimal
    by_category: dict[str, Decimal]
    count: int
