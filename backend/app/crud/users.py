import re
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def find_by_email(db: Session, email: str) -> Optional[User]:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def find_by_mobile(db: Session, mobile: str) -> Optional[User]:
    digits = re.sub(r"\D", "", mobile or "")
    return db.scalar(select(User).where(User.mobile == digits))


def find_by_identifier(db: Session, identifier: str) -> Optional[User]:
    raw = (identifier or "").strip()
    if "@" in raw:
        return find_by_email(db, raw)
    return find_by_mobile(db, raw)
