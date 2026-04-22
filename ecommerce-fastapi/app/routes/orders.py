"""
app/routers/orders.py
──────────────────────
Order routes.

User routes:  POST /orders, GET /orders, GET /orders/{id}, POST /orders/{id}/cancel
Admin routes: PATCH /orders/{id}/status, GET /orders (all users)
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.schemas.common import PaginatedResponse
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def place_order(
    data: OrderCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Place a new order. Automatically:
    - Validates product availability and stock
    - Snapshots prices at purchase time
    - Deducts stock
    - Calculates tax and totals
    """
    return await order_service.create_order(db, user_id=current_user.id, data=data)


@router.get("/", response_model=PaginatedResponse[OrderResponse])
async def get_my_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's own orders, paginated."""
    return await order_service.list_user_orders(
        db, user_id=current_user.id, page=page, page_size=page_size
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific order. Users can only see their own orders.
    Admins can see any order via the admin endpoint below.
    """
    return await order_service.get_order(db, order_id, user_id=current_user.id)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an order (only if still pending or confirmed). Also restores stock."""
    return await order_service.cancel_order(db, order_id, user_id=current_user.id)


# ── Admin Routes ──────────────────────────────────────────────────────────────

@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    dependencies=[Depends(require_admin)],
)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """[Admin] Update an order's status (e.g., mark as shipped, delivered)."""
    return await order_service.update_order_status(db, order_id, data)
