from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from enum import Enum
from typing import Optional

from workos import WorkOSClient
from workos.audit_logs import (
    AuditLogEvent,
    AuditLogEventActor,
    AuditLogEventContext,
    AuditLogEventTarget,
)

from app.core.config import settings
from app.core.audit_events import AuditEvent

logger = logging.getLogger(__name__)

workos_client = WorkOSClient(
    api_key=settings.WORKOS_API_KEY,
    client_id=settings.WORKOS_CLIENT_ID,
)


def get_workos_client() -> WorkOSClient:
    return workos_client


def _build_workos_audit_event(
    event: AuditEvent | str,
    actor_id: str,
    target_id: str,
    actor_name: Optional[str] = None,
    target_name: Optional[str] = None,
    actor_type: str = "user",
    target_type: str = "user",
    request=None,
    metadata: Optional[dict] = None,
) -> AuditLogEvent:
    location = None
    user_agent = None

    if request is not None:
        location = request.client.host if getattr(request, "client", None) else None
        user_agent = request.headers.get("user-agent")

    context = AuditLogEventContext(
        location=location or "unknown",
        user_agent=user_agent,
    )

    actor = AuditLogEventActor(
        id=str(actor_id),
        type=actor_type,
        name=actor_name,
        metadata=metadata,
    )

    target = AuditLogEventTarget(
        id=str(target_id),
        type=target_type,
        name=target_name,
        metadata=metadata,
    )

    action_value = event.value if isinstance(event, Enum) else str(event)

    return AuditLogEvent(
        action=action_value,
        occurred_at=datetime.utcnow(),
        actor=actor,
        targets=[target],
        context=context,
        metadata=metadata,
    )


def create_workos_audit_event(
    event: AuditEvent | str,
    actor_id: str,
    target_id: str,
    *,
    actor_name: Optional[str] = None,
    target_name: Optional[str] = None,
    actor_type: str = "user",
    target_type: str = "user",
    request=None,
    metadata: Optional[dict] = None,
    idempotency_key: Optional[str] = None,
):
    """Create a WorkOS audit event via the WorkOS Audit Logs API."""
    event_payload = _build_workos_audit_event(
        event=event,
        actor_id=actor_id,
        target_id=target_id,
        actor_name=actor_name,
        target_name=target_name,
        actor_type=actor_type,
        target_type=target_type,
        request=request,
        metadata=metadata,
    )

    try:
        return workos_client.audit_logs.create_event(
            organization_id=settings.WORKOS_ORGANIZATION_ID,
            event=event_payload,
            idempotency_key=idempotency_key,
        )
    except Exception as exc:
        logger.exception("WorkOS audit event failed: %s", exc)
        raise


async def create_workos_audit_event_async(
    event: AuditEvent | str,
    actor_id: str,
    target_id: str,
    *,
    actor_name: Optional[str] = None,
    target_name: Optional[str] = None,
    actor_type: str = "user",
    target_type: str = "user",
    request=None,
    metadata: Optional[dict] = None,
    idempotency_key: Optional[str] = None,
):
    return await asyncio.to_thread(
        create_workos_audit_event,
        event,
        actor_id,
        target_id,
        actor_name=actor_name,
        target_name=target_name,
        actor_type=actor_type,
        target_type=target_type,
        request=request,
        metadata=metadata,
        idempotency_key=idempotency_key,
    )


