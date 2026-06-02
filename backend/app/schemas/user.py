from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole, UserStatus
from app.schemas.common import HOUSE_RE, MOBILE_RE, NAME_RE, PLOT_RE, _digits_only


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    mobile: str
    house: str
    plot_no: Optional[str] = None
    password: str = Field(min_length=6, max_length=64)

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if not NAME_RE.match(v):
            raise ValueError("Use letters, spaces, dots, hyphens or apostrophes only.")
        return v

    @field_validator("mobile")
    @classmethod
    def _mobile(cls, v: str) -> str:
        d = _digits_only(v)
        if not MOBILE_RE.match(d):
            raise ValueError("Mobile must be exactly 10 digits and start with 6-9.")
        return d

    @field_validator("house")
    @classmethod
    def _house(cls, v: str) -> str:
        v = v.strip()
        if not HOUSE_RE.match(v):
            raise ValueError("House/villa number is invalid.")
        return v

    @field_validator("plot_no")
    @classmethod
    def _plot(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        v = v.strip()
        if not PLOT_RE.match(v):
            raise ValueError("Plot number is invalid.")
        return v

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Password cannot contain spaces.")
        return v

    @field_validator("email")
    @classmethod
    def _email_lower(cls, v: EmailStr) -> EmailStr:
        return EmailStr(str(v).lower())  # type: ignore[arg-type]


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=160)
    password: str = Field(min_length=1, max_length=64)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    mobile: str
    house: Optional[str]
    plot_no: Optional[str]
    role: UserRole
    status: UserStatus
    is_seed: bool
    created_at: datetime
    approved_at: Optional[datetime]


class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    mobile: str
    house: Optional[str] = None
    plot_no: Optional[str] = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if not NAME_RE.match(v):
            raise ValueError("Use letters, spaces, dots, hyphens or apostrophes only.")
        return v

    @field_validator("mobile")
    @classmethod
    def _mobile(cls, v: str) -> str:
        d = _digits_only(v)
        if not MOBILE_RE.match(d):
            raise ValueError("Mobile must be exactly 10 digits and start with 6-9.")
        return d

    @field_validator("house")
    @classmethod
    def _house(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        v = v.strip()
        if not HOUSE_RE.match(v):
            raise ValueError("House/villa number is invalid.")
        return v

    @field_validator("plot_no")
    @classmethod
    def _plot(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        v = v.strip()
        if not PLOT_RE.match(v):
            raise ValueError("Plot number is invalid.")
        return v


class ChangeEmailRequest(BaseModel):
    email: EmailStr
    current_password: str = Field(min_length=1, max_length=64)

    @field_validator("email")
    @classmethod
    def _email_lower(cls, v: EmailStr) -> EmailStr:
        return EmailStr(str(v).lower())  # type: ignore[arg-type]


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=64)
    new_password: str = Field(min_length=6, max_length=64)

    @field_validator("new_password")
    @classmethod
    def _no_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Password cannot contain spaces.")
        return v


class ApprovalRequest(BaseModel):
    approve: bool


TokenResponse.model_rebuild()
