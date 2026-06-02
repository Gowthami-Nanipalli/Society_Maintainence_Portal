from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_officer
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogOut


router = APIRouter(prefix="/api/audit-log", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_log(
    limit: int = Query(default=100, ge=1, le=500),
    action: str | None = None,
    entity_type: str | None = None,
    _: User = Depends(require_officer),
    db: Session = Depends(get_db),
) -> list[AuditLogOut]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    rows = db.scalars(stmt).all()
    return [AuditLogOut.model_validate(r) for r in rows]
