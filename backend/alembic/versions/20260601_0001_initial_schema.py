"""initial schema

Revision ID: 20260601_0001
Revises:
Create Date: 2026-06-01 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260601_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("mobile", sa.String(length=10), nullable=False),
        sa.Column("house", sa.String(length=40), nullable=True),
        sa.Column("plot_no", sa.String(length=40), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_seed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by_id", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("mobile", name="uq_users_mobile"),
        sa.CheckConstraint("char_length(mobile) = 10", name="ck_users_mobile_is_10_digits"),
        sa.ForeignKeyConstraint(
            ["approved_by_id"], ["users.id"],
            name="fk_users_approved_by_id_users",
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_status", "users", ["status"])

    op.create_table(
        "fiscal_years",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=16), nullable=False),
        sa.Column("start_year", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name="pk_fiscal_years"),
        sa.UniqueConstraint("label", name="uq_fiscal_years_label"),
        sa.UniqueConstraint("start_year", name="uq_fiscal_years_start_year"),
        sa.CheckConstraint("end_date > start_date", name="ck_fiscal_years_fy_dates_ordered"),
    )

    op.create_table(
        "maintenance_bills",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("fiscal_year_id", sa.Integer(), nullable=False),
        sa.Column("plot_no", sa.String(length=40), nullable=False),
        sa.Column("payable_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name="pk_maintenance_bills"),
        sa.ForeignKeyConstraint(
            ["member_id"], ["users.id"],
            name="fk_maintenance_bills_member_id_users",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["fiscal_year_id"], ["fiscal_years.id"],
            name="fk_maintenance_bills_fiscal_year_id_fiscal_years",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("member_id", "fiscal_year_id", name="uq_bills_member_fy"),
        sa.CheckConstraint("payable_amount >= 0", name="ck_maintenance_bills_payable_non_negative"),
    )
    op.create_index("ix_maintenance_bills_member_id", "maintenance_bills", ["member_id"])
    op.create_index("ix_maintenance_bills_fiscal_year_id", "maintenance_bills", ["fiscal_year_id"])

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bill_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("paid_on", sa.Date(), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=False),
        sa.Column("reference", sa.String(length=80), nullable=True),
        sa.Column("note", sa.String(length=200), nullable=True),
        sa.Column("recorded_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name="pk_payments"),
        sa.ForeignKeyConstraint(
            ["bill_id"], ["maintenance_bills.id"],
            name="fk_payments_bill_id_maintenance_bills",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["recorded_by_id"], ["users.id"],
            name="fk_payments_recorded_by_id_users",
            ondelete="SET NULL",
        ),
        sa.CheckConstraint("amount > 0", name="ck_payments_amount_positive"),
    )
    op.create_index("ix_payments_bill_id", "payments", ["bill_id"])

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("spent_on", sa.Date(), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name="pk_expenses"),
        sa.ForeignKeyConstraint(
            ["created_by_id"], ["users.id"],
            name="fk_expenses_created_by_id_users",
            ondelete="SET NULL",
        ),
        sa.CheckConstraint("amount > 0", name="ck_expenses_amount_positive"),
    )
    op.create_index("ix_expenses_spent_on", "expenses", ["spent_on"])
    op.create_index("ix_expenses_category", "expenses", ["category"])

    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("actor_label", sa.String(length=160), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=40), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name="pk_audit_log"),
        sa.ForeignKeyConstraint(
            ["actor_id"], ["users.id"],
            name="fk_audit_log_actor_id_users",
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_audit_log_actor_id", "audit_log", ["actor_id"])
    op.create_index("ix_audit_log_action", "audit_log", ["action"])
    op.create_index("ix_audit_log_entity_type", "audit_log", ["entity_type"])
    op.create_index("ix_audit_log_created_at", "audit_log", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_log_created_at", table_name="audit_log")
    op.drop_index("ix_audit_log_entity_type", table_name="audit_log")
    op.drop_index("ix_audit_log_action", table_name="audit_log")
    op.drop_index("ix_audit_log_actor_id", table_name="audit_log")
    op.drop_table("audit_log")

    op.drop_index("ix_expenses_category", table_name="expenses")
    op.drop_index("ix_expenses_spent_on", table_name="expenses")
    op.drop_table("expenses")

    op.drop_index("ix_payments_bill_id", table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_maintenance_bills_fiscal_year_id", table_name="maintenance_bills")
    op.drop_index("ix_maintenance_bills_member_id", table_name="maintenance_bills")
    op.drop_table("maintenance_bills")

    op.drop_table("fiscal_years")

    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_table("users")
