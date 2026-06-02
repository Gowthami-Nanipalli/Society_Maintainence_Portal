from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.maintenance_bill import MaintenanceBill
    from app.models.payment import Payment


class UserRole(str, enum.Enum):
    treasurer = "treasurer"
    president = "president"
    secretary = "secretary"
    community_member = "community_member"


class UserStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"
    disabled = "disabled"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("mobile", name="uq_users_mobile"),
        CheckConstraint("char_length(mobile) = 10", name="mobile_is_10_digits"),
        Index("ix_users_role", "role"),
        Index("ix_users_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False)
    mobile: Mapped[str] = mapped_column(String(10), nullable=False)
    house: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    plot_no: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False, length=32),
        nullable=False,
        default=UserRole.community_member,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", native_enum=False, length=32),
        nullable=False,
        default=UserStatus.pending,
    )

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_seed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    bills: Mapped[list["MaintenanceBill"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
        foreign_keys="MaintenanceBill.member_id",
    )
    payments_recorded: Mapped[list["Payment"]] = relationship(
        back_populates="recorded_by",
        foreign_keys="Payment.recorded_by_id",
    )
    audit_entries: Mapped[list["AuditLog"]] = relationship(
        back_populates="actor",
        foreign_keys="AuditLog.actor_id",
    )
