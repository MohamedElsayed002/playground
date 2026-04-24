import math 
import uuid 
from decimal import Decimal 
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product 
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.exceptions.handlers import NotFoundException, BadRequestException

def __generate_order_number() -> str:
    """
    Generate a human readable unique order number like ORD-20240417-A3F2.
    """

    date_str = datetime.now().strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:6].upper()
    return f"ORD-{date_str}-{unique_part}"


async def create_order(db:AsyncSession, user_id: int, data: OrderCreate):
    """
        Place and Order:
        1. Load and validate each product
        2. Check stock availability 
        3. Snapshot prices
        4. Deduct stock 
        5. Create order + OrderItems
    """

    order_items_data = []
    subtotal = Decimal("0")

    for item_data in data.items:
        # Load Product 
        result = await db.execute(select(Product).where(
            Product.id == item_data.product_id,
            Product.is_deleted == False,
            Product.is_active == True
        ))

        product = result.scalar_one_or_none()

        if not product:
            raise NotFoundException("Product",item_data.product_id)
        
        # Check stock 
        if product.stock_quantity < item_data.quantity:
            raise BadRequestException(
                f"Insufficient stock for '{product.name}'. "
                f"Available: {product.stock_quantity}, requested: {item_data.quantity}."
            )
        
        # Snapshot price at order time
        unit_price = product.price 
        total_price = unit_price * item_data.quantity 
        subtotal += total_price

        # Deduct stock immediately (prevents over-selling)
        product.stock_quantity -= item_data.quantity

        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item_data.quantity,
            "unit_price": unit_price,
            "total_price": total_price
        })

    # Create the order record 
    order = Order(
        order_number=__generate_order_number(),
        user_id=user_id,
        subtotal=subtotal,
        shipping_cost=Decimal("0"),
        tax=subtotal * Decimal("0.14"),
        total=subtotal + (subtotal * Decimal("0.14")),
        shipping_address_line1=data.shipping_address_line1,
        shipping_address_line2=data.shipping_address_line2,
        shipping_city=data.shipping_city,
        shipping_country=data.shipping_country,
        shipping_postal_code=data.shipping_postal_code,
        notes=data.notes,
    )
    db.add(order)
    await db.flush()

    # Create OrderItem records 
    for item_data in order_items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)
    await db.flush()
    await db.refresh(order) 
    return order


async def get_order(db: AsyncSession, order_id: int, user_id: int | None = None) -> Order:
    """
    Get an order by ID 
    If user_Id is provided, also filters by user (prevents users acessing others orders)
    """

    query = select(Order).where(Order.id == order_id)
    if user_id is not None:
        query = query.where(Order.user_id == user_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundException("Order",order_id)
    return order


async def list_user_orders(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    page_size: int = 20
) -> dict:
    """
        Get paginated orders for a specific user.
    """

    offset = (page - 1) * page_size

    count = (await db.execute(
        select(func.count(Order.id)).where(Order.user_id == user_id)
    )).scalar_one()

    result = await db.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc()).offset(offset).limit(page_size)
    )

    return {
        "items": list(result.scalars().all()),
        "total": count,
        "page": page,
        "pages": math.ceil(count / page_size) if count else 0,
        "page_size": page_size,
    }


async def update_order_status(
    db: AsyncSession, order_id: int, data:OrderStatusUpdate
) -> Order:
    """
        Admin updates an order's status.
    """

    order = await get_order(db,order_id)

    if order.status in (OrderStatus.CANCELLED, OrderStatus.REFUNDED):
        raise BadRequestException(f"Cannot update a {order.status.value} order")

    order.status = data.status
    if data.payment_status:
        order.payment_status = data.payment_status
    await db.flush()
    await db.refresh(order)
    return order


async def cancel_order(db:AsyncSession, order_id: int, user_id: int) -> Order:
    """
        User cancels their own order (only if still pending/confirmed)
    """
    order = await get_order(db, order_id=order_id, user_id=user_id)

    if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
        raise BadRequestException(
            f"Cannot cancel an order that is already {order.status.value}"
        )
    order.status = OrderStatus.CANCELLED

    # Restore stock for each item
    for item in order.items:
        if item.product_id:
            result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = result.scalar_one_or_none()
            if product:
                product.stock_quantity += item.quantity
    await db.flush()
    await db.refresh(order)
    return order
