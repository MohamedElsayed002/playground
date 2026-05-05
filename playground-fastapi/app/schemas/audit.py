from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    event: str
    user_id: int | None
    status: str
    ip_address: str | None
    user_agent: str | None
    extra: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
