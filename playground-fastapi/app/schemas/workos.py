from pydantic import BaseModel
from typing import Any 

class AuditEvent(BaseModel):

    organization_id: str 
    action: str 

    actor_id: str 
    actor_name: str | None = None 

    target_id: str 
    target_type: str 

    metadata: dict[str,Any] | None = None 

    ip_address: str | None = None 
    user_agent: str | None = None