from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.crud.users import find_by_email, find_by_identifier, find_by_mobile
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> UserOut:
    """Anyone may register. The account is created in `pending` state — the
    user can log in immediately with read-only access; Secretary approval is
    what flips them to `active` and adds their plot to the billing ledger."""

    if find_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    if find_by_mobile(db, payload.mobile):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this mobile number already exists.",
        )

    user = User(
        name=payload.name,
        email=str(payload.email).lower(),
        mobile=payload.mobile,
        house=payload.house,
        plot_no=payload.plot_no,
        role=UserRole.community_member,
        status=UserStatus.pending,
        password_hash=hash_password(payload.password),
        is_seed=False,
    )
    db.add(user)
    db.flush()

    record_audit(
        db,
        actor=user,
        action="signup",
        entity_type="user",
        entity_id=user.id,
        summary=f"New member {user.email} signed up; awaiting Secretary approval.",
        payload={"email": user.email, "mobile": user.mobile, "house": user.house},
    )
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = find_by_identifier(db, payload.identifier)
    if not user or not verify_password(payload.password, user.password_hash):
        # Don't leak whether the identifier exists.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/mobile or password is incorrect.",
        )

    if user.status == UserStatus.rejected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account request was declined. Please contact the community office.",
        )
    if user.status == UserStatus.disabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    """Always returns the same response regardless of whether the identifier
    matches an account, to avoid disclosing which accounts exist. Real reset
    flow (email/SMS dispatch) is out of scope for this milestone — we just
    log the attempt for the audit trail."""

    user = find_by_identifier(db, payload.identifier)
    record_audit(
        db,
        actor=user,
        action="forgot_password_requested",
        entity_type="user",
        entity_id=user.id if user else None,
        summary=f"Password reset requested for {payload.identifier}",
    )
    db.commit()
    return {"detail": "If an account exists, instructions have been sent."}
