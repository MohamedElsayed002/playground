from fastapi import APIRouter, Depends, Query, status, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.schemas.order import OrderCreate, OrderCheckoutCreate, OrderResponse, OrderStatusUpdate
from app.schemas.cart import CartItemCreate, CartResponse
from app.schemas.common import PaginatedResponse
from app.services import order_service
from app.services.order_service_2 import OrderService
from app.models.user import User
from app.services.checkout.create_checkout import CheckoutService
import uuid
router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def place_order(
    data: OrderCheckoutCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Place a new order from the current user's cart.
    Automatically:
    - Loads cart items
    - Validates product availability and stock
    - Snapshots prices at purchase time
    - Deducts stock
    - Clears the cart after success
    """
    return await order_service.create_order(db, user_id=current_user.id, data=data)


@router.post(
    "/cart/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_cart(
    data: CartItemCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a product to the current user's cart, or increment its quantity."""
    return await order_service.add_to_cart(
        db,
        user_id=current_user.id,
        product_id=data.product_id,
        quantity=data.quantity,
    )


@router.get(
    "/cart",
    response_model=CartResponse,
    summary="Get the current user's cart",
)
async def get_cart(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's cart with product details and subtotal."""
    cart = await order_service.get_cart(db, current_user.id)
    return CartResponse.model_validate(cart)


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


@router.post('/testing-route')
async def testing_route(
    data: OrderCheckoutCreate,
    # current_user= Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    idempotency_key: str | None = Header(
        None,
        description="Unique identifier for request idempotency."
                    "Same key = cached response, prevents duplicate processing. Optional - if not provided, UUID will be auto-generated"
    ),
):  
    key = idempotency_key or str(uuid.uuid4())
    checkout_service = CheckoutService(db)
    return await checkout_service.checkout_2(key, 3, data)


@router.get(
    "/my",
    response_model=PaginatedResponse[OrderResponse],
    summary="List the current user's orders",
)
async def my_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Alias route for the current user's orders."""
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
