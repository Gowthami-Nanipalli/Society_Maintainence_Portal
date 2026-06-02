import re

from pydantic import BaseModel, EmailStr, Field, field_validator


MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
NAME_RE = re.compile(r"^[A-Za-z][A-Za-z .'-]{1,59}$")
HOUSE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 \-/]{1,39}$")
PLOT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 &\-/]{0,39}$")


def _digits_only(value: str) -> str:
    return re.sub(r"\D", "", value or "")


class Identifier(BaseModel):
    """Login identifier: email OR 10-digit Indian mobile."""

    value: str = Field(min_length=1, max_length=160)

    @field_validator("value")
    @classmethod
    def normalise(cls, raw: str) -> str:
        v = raw.strip()
        if "@" in v:
            # Trust EmailStr later — just lowercase here.
            return v.lower()
        digits = _digits_only(v)
        if not MOBILE_RE.match(digits):
            raise ValueError("Enter a valid email or a 10-digit Indian mobile number.")
        return digits
