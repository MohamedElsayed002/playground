import logging
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def get_audit_log(db: AsyncSession, log_id: int) -> AuditLog:
    result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    log = result.scalar_one_or_none()
    if log is None:
        from app.exceptions.handlers import NotFoundException
        raise NotFoundException("AuditLog", log_id)
    return log


async def list_audit_logs(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        event: str | None = None,
        status: str | None = None,
        user_id: int | None = None,
) -> dict:
    offset = (page - 1) * page_size

    query = select(AuditLog)
    if event is not None:
        query = query.where(AuditLog.event == event)
    if status is not None:
        query = query.where(AuditLog.status == status)
    if user_id is not None:
        query = query.where(AuditLog.user_id == user_id)

    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    result = await db.execute(
        query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
    )

    logs = list(result.scalars().all())
    return {
        "items": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    }


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
