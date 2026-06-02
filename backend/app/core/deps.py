from collections.abc import Iterable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    user = db.get(User, int(sub))
    if user is None:
        raise HTTPException(status_code=401, detail="Account no longer exists.")
    if user.status in (UserStatus.rejected, UserStatus.disabled):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active.",
        )
    return user


def require_roles(*allowed: UserRole):
    allowed_set = set(allowed)

    def _dep(current: User = Depends(get_current_user)) -> User:
        if current.role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current

    return _dep


def require_treasurer(current: User = Depends(get_current_user)) -> User:
    if current.role != UserRole.treasurer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Treasurer can perform this action.",
        )
    return current


def require_secretary(current: User = Depends(get_current_user)) -> User:
    if current.role != UserRole.secretary:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Secretary can perform this action.",
        )
    return current


def require_officer(current: User = Depends(get_current_user)) -> User:
    officer_roles: Iterable[UserRole] = (UserRole.treasurer, UserRole.president, UserRole.secretary)
    if current.role not in officer_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer privileges required.",
        )
    return current
