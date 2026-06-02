"""Idempotent seeder.

Creates *exactly three* officer accounts (Treasurer, President, Secretary)
from the SEED_* env vars. If an officer email already exists, the seeder
will NOT overwrite the password hash — operators must rotate the seed
passwords via the API after the first run.

Run with:

    python -m app.seed

(from inside the `backend/` directory, with the virtualenv active).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus


SEED_MOBILES = {
    UserRole.treasurer: "9000000001",
    UserRole.president: "9000000002",
    UserRole.secretary: "9000000003",
}


def _seed_officer(
    db: Session,
    *,
    role: UserRole,
    name: str,
    email: str,
    password: str,
) -> tuple[User, bool]:
    """Create or update an officer seed. Returns (user, created)."""
    email_norm = email.strip().lower()
    existing = db.query(User).filter(User.email == email_norm).first()
    if existing:
        # Don't overwrite passwords for existing officers. Just make sure they
        # are flagged as active seed accounts so they can log in.
        changed = False
        if existing.status != UserStatus.active:
            existing.status = UserStatus.active
            changed = True
        if not existing.is_seed:
            existing.is_seed = True
            changed = True
        if existing.role != role:
            existing.role = role
            changed = True
        if changed:
            db.flush()
        return existing, False

    user = User(
        name=name,
        email=email_norm,
        mobile=SEED_MOBILES[role],
        house=None,
        plot_no=None,
        role=role,
        status=UserStatus.active,
        password_hash=hash_password(password),
        is_seed=True,
        approved_at=datetime.now(tz=timezone.utc),
    )
    db.add(user)
    db.flush()
    return user, True


def seed(db: Session) -> None:
    settings = get_settings()

    treasurer, t_created = _seed_officer(
        db,
        role=UserRole.treasurer,
        name=settings.SEED_TREASURER_NAME,
        email=settings.SEED_TREASURER_EMAIL,
        password=settings.SEED_TREASURER_PASSWORD,
    )
    president, p_created = _seed_officer(
        db,
        role=UserRole.president,
        name=settings.SEED_PRESIDENT_NAME,
        email=settings.SEED_PRESIDENT_EMAIL,
        password=settings.SEED_PRESIDENT_PASSWORD,
    )
    secretary, s_created = _seed_officer(
        db,
        role=UserRole.secretary,
        name=settings.SEED_SECRETARY_NAME,
        email=settings.SEED_SECRETARY_EMAIL,
        password=settings.SEED_SECRETARY_PASSWORD,
    )

    for user, created in (
        (treasurer, t_created),
        (president, p_created),
        (secretary, s_created),
    ):
        if created:
            record_audit(
                db,
                actor=None,
                action="officer_seeded",
                entity_type="user",
                entity_id=user.id,
                summary=f"Seed officer {user.role.value} created: {user.email}",
            )
        print(
            f"{'created' if created else 'verified'}: "
            f"{user.role.value:<18} {user.email}"
        )

    db.commit()


def main() -> None:
    with SessionLocal() as db:
        seed(db)
    print("seed complete.")


if __name__ == "__main__":
    main()
