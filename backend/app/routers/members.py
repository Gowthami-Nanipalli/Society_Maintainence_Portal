from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import (
    get_current_user,
    require_officer,
    require_secretary,
)
from app.core.security import hash_password, verify_password
from app.crud.users import find_by_email, find_by_mobile
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    ApprovalRequest,
    ChangeEmailRequest,
    ChangePasswordRequest,
    UpdateProfileRequest,
    UserOut,
)


router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=list[UserOut])
def list_members(
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    role_filter: UserRole | None = Query(default=None, alias="role"),
    _: User = Depends(require_officer),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    stmt = select(User).order_by(User.name.asc())
    if status_filter is not None:
        stmt = stmt.where(User.status == status_filter)
    if role_filter is not None:
        stmt = stmt.where(User.role == role_filter)
    return [UserOut.model_validate(u) for u in db.scalars(stmt).all()]


@router.get("/pending", response_model=list[UserOut])
def list_pending(
    _: User = Depends(require_officer),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    rows = db.scalars(
        select(User).where(User.status == UserStatus.pending).order_by(User.created_at.asc())
    ).all()
    return [UserOut.model_validate(u) for u in rows]


@router.post("/{member_id}/approval", response_model=UserOut)
def decide_approval(
    member_id: int,
    payload: ApprovalRequest,
    actor: User = Depends(require_secretary),
    db: Session = Depends(get_db),
) -> UserOut:
    target = db.get(User, member_id)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found.")
    if target.status != UserStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending accounts can be approved or rejected.",
        )

    if payload.approve:
        target.status = UserStatus.active
        target.approved_at = datetime.now(tz=timezone.utc)
        target.approved_by_id = actor.id
        action = "member_approved"
        summary = f"Approved {target.email} as Community Member."
    else:
        target.status = UserStatus.rejected
        action = "member_rejected"
        summary = f"Rejected signup for {target.email}."

    record_audit(
        db,
        actor=actor,
        action=action,
        entity_type="user",
        entity_id=target.id,
        summary=summary,
    )
    db.commit()
    db.refresh(target)
    return UserOut.model_validate(target)


@router.patch("/me", response_model=UserOut)
def update_my_profile(
    payload: UpdateProfileRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    # Mobile uniqueness check.
    conflict = find_by_mobile(db, payload.mobile)
    if conflict and conflict.id != current.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That mobile number is already used by another member.",
        )

    before = {
        "name": current.name,
        "mobile": current.mobile,
        "house": current.house,
        "plot_no": current.plot_no,
    }
    current.name = payload.name
    current.mobile = payload.mobile
    current.house = payload.house
    current.plot_no = payload.plot_no

    record_audit(
        db,
        actor=current,
        action="profile_updated",
        entity_type="user",
        entity_id=current.id,
        summary=f"Profile updated for {current.email}",
        payload={
            "before": before,
            "after": {
                "name": current.name,
                "mobile": current.mobile,
                "house": current.house,
                "plot_no": current.plot_no,
            },
        },
    )
    db.commit()
    db.refresh(current)
    return UserOut.model_validate(current)


@router.post("/me/change-email", response_model=UserOut)
def change_my_email(
    payload: ChangeEmailRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(status_code=403, detail="Current password is incorrect.")

    new_email = str(payload.email).lower()
    if new_email == current.email:
        raise HTTPException(status_code=400, detail="New email is the same as the current one.")

    existing = find_by_email(db, new_email)
    if existing and existing.id != current.id:
        raise HTTPException(status_code=409, detail="That email is already in use.")

    old_email = current.email
    current.email = new_email

    record_audit(
        db,
        actor=current,
        action="email_changed",
        entity_type="user",
        entity_id=current.id,
        summary=f"Email changed from {old_email} to {new_email}",
        payload={"old_email": old_email, "new_email": new_email},
    )
    db.commit()
    db.refresh(current)
    return UserOut.model_validate(current)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(
    payload: ChangePasswordRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(status_code=403, detail="Current password is incorrect.")
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400, detail="New password must differ from the current one."
        )

    current.password_hash = hash_password(payload.new_password)

    record_audit(
        db,
        actor=current,
        action="password_changed",
        entity_type="user",
        entity_id=current.id,
        summary=f"Password changed for {current.email}",
    )
    db.commit()
    return None
