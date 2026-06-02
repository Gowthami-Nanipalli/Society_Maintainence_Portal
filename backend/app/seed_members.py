"""One-off member seeder for the Arihant CardMaster Enclave FY 25/26 ledger.

Creates 26 unique member accounts. Narender Surana appears at s.no 1
(plots 1 & 2, plus 23 listed for reference) and again at s.no 18 as a
separate account for plot 23 — same person, two accounts, mirroring
the two ledger lines.

All accounts are inserted in `pending` status so the Secretary can
approve them through the normal /api/members/{id}/approval flow.

Idempotent: re-running skips emails / mobiles that already exist.

Run from `backend/` with the venv active:

    python -m app.seed_members
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.security import hash_password
from app.crud.users import find_by_email, find_by_mobile
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus


@dataclass(frozen=True)
class MemberRow:
    name: str
    plots: tuple[str, ...]  # one or more plot groupings owned by this member
    # Optional overrides — used when the default slug-based email or the
    # index-based mobile would collide (e.g. a second account for the same
    # person). When None, the seeder derives both from name and position.
    email: str | None = None
    mobile: str | None = None


MEMBERS: list[MemberRow] = [
    MemberRow("Narender Surana", ("1 & 2", "23")),
    MemberRow("Gopal", ("3",)),
    MemberRow("Paul Devapriyam Pulla", ("4 & 5",)),
    MemberRow("Dr Sastry", ("6",)),
    MemberRow("Gowtham Jain", ("7",)),
    MemberRow("Sanjay Jain", ("8 & 9",)),
    MemberRow("Kumar Swamy", ("10 & 11",)),
    MemberRow("Pawan Agarwal", ("12 & 13",)),
    MemberRow("Zubin Viccajee", ("14",)),
    MemberRow("Rajesh Danda", ("15",)),
    MemberRow("MR Vikram", ("16",)),
    MemberRow("Dhunji Mistry", ("17",)),
    MemberRow("Shashidhar Reddy", ("18",)),
    MemberRow("Ramesh Kumar", ("19",)),
    MemberRow("Ajay Harinath", ("20",)),
    MemberRow("Major Vivek", ("21",)),
    MemberRow("MV Ranga", ("22",)),
    MemberRow(
        "Narender Surana",
        ("23",),
        email="narendersuranaplot23@gmail.com",
        mobile="9000010026",
    ),
    MemberRow("Sandeep Soni", ("24",)),
    MemberRow("Bhasker Rao", ("25",)),
    MemberRow("Ritu Pokarna", ("26",)),
    MemberRow("Gumidelli Srinivas", ("27",)),
    MemberRow("Mayank Sanghani", ("28",)),
    MemberRow("Venkatesh Gupta", ("29",)),
    MemberRow("Mahati Singh", ("30 & 31",)),
    MemberRow("Deepak Bang", ("32",)),
]

# Placeholder mobiles — the image had no phone numbers. They start with 9
# (satisfies the 6-9 constraint) and are unique. Members can update their
# real number from the profile page after Secretary approval.
MOBILE_BASE = 9000010001


def _slug(name: str) -> str:
    """'Paul Devapriyam Pulla' -> 'pauldevapriyampulla' for the email local-part."""
    return "".join(name.split()).lower()


def _password(name: str) -> str:
    """'MR Vikram' -> 'MRVikram123' (no spaces, preserves casing)."""
    return "".join(name.split()) + "123"


def seed_members(db: Session) -> tuple[int, int]:
    created = 0
    skipped = 0
    # Default mobile counter only advances for rows without an explicit
    # mobile override, so adding override rows doesn't shift everyone else.
    default_mobile_index = 0

    for row in MEMBERS:
        email = row.email or f"{_slug(row.name)}@gmail.com"
        if row.mobile:
            mobile = row.mobile
        else:
            mobile = str(MOBILE_BASE + default_mobile_index)
            default_mobile_index += 1
        primary_plot = row.plots[0]

        if find_by_email(db, email) or find_by_mobile(db, mobile):
            print(f"skip (already exists): {row.name:<24} {email}")
            skipped += 1
            continue

        user = User(
            name=row.name,
            email=email,
            mobile=mobile,
            house=None,
            plot_no=primary_plot,
            role=UserRole.community_member,
            status=UserStatus.pending,
            password_hash=hash_password(_password(row.name)),
            is_seed=False,
        )
        db.add(user)
        db.flush()

        extra_plots = ", ".join(row.plots[1:]) if len(row.plots) > 1 else None
        summary = f"Bulk-seeded ledger member {email} (plot {primary_plot})"
        if extra_plots:
            summary += f"; also owns plot(s) {extra_plots}"

        record_audit(
            db,
            actor=None,
            action="member_bulk_seeded",
            entity_type="user",
            entity_id=user.id,
            summary=summary,
            payload={
                "email": email,
                "mobile": mobile,
                "plots": list(row.plots),
            },
        )
        print(
            f"created pending: {row.name:<24} {email:<40} "
            f"password={_password(row.name)} plots={list(row.plots)}"
        )
        created += 1

    db.commit()
    return created, skipped


def main() -> None:
    with SessionLocal() as db:
        created, skipped = seed_members(db)
    print(f"\ndone. created={created} skipped={skipped} total_rows={len(MEMBERS)}")


if __name__ == "__main__":
    main()
