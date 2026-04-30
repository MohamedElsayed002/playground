import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def create_audit_log(
        db: AsyncSession | None,
        event: str,
        status: str,
        user_id: int | None = None,
        request=None,
        metadata: dict | None = None,
        commit: bool = False,
):
    try:
        log = AuditLog(
            event=event,
            user_id=user_id,
            status=status,
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
            extra =metadata or {}
        )

        if db is None:
            async with AsyncSessionLocal() as session:
                session.add(log)
                await session.commit()
            return

        db.add(log)

        if commit:
            await db.commit()
        else:
            await db.flush()

    except Exception as e:
        logger.exception("Audit log failed: %s", e)
