from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_service import get_audit_log, list_audit_logs
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get(
    "/",
    response_model=PaginatedResponse[AuditLogResponse],
    # I let this route public it's not a mistake or a bug from me. 
    # dependencies=[Depends(require_admin)],
)
# @limiter.limit("1/hour")
async def audit_logs_list(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    event: str | None = Query(default=None),
    status: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await list_audit_logs(
        db,
        page=page,
        page_size=page_size,
        event=event,
        status=status,
        user_id=user_id,
    )


@router.get(
    "/{log_id}",
    response_model=AuditLogResponse,
    dependencies=[Depends(require_admin)],
)
async def audit_log_by_id(log_id: int, db: AsyncSession = Depends(get_db)):
    """[Admin] Fetch a single audit log entry by ID."""
    return await get_audit_log(db, log_id)
