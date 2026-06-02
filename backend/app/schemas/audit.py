from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: Optional[int]
    actor_label: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[int]
    summary: Optional[str]
    payload: Optional[dict[str, Any]]
    created_at: datetime
