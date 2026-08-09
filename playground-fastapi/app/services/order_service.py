import math 
import uuid 
from decimal import Decimal 
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product 
from app.schemas.order import OrderCheckoutCreate, OrderStatusUpdate
from app.models.user import User
from app.exceptions.handlers import NotFoundException, BadRequestException

def __generate_order_number() -> str:
    """
    Generate a human readable unique order number like ORD-20240417-A3F2.
    """

    date_str = datetime.now().strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:6].upper()
    return f"ORD-{date_str}-{unique_part}"



async def get_cart(db: AsyncSession, user_id: int) -> Cart:
    """
    Get the current user's cart.
    If the user does not have one yet, create an empty cart.
    """

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User", user_id)

    cart_result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = cart_result.scalar_one_or_none()

    if cart is None:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.flush()

    refreshed = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    return refreshed.scalar_one()


async def add_to_cart(db: AsyncSession, user_id: int, product_id: int, quantity: int):
    if quantity <= 0:
        raise BadRequestException("Quantity must be greater than zero")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User", user_id)

    product_result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.is_deleted == False,
            Product.is_active == True,
        )
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product", product_id)

    cart = await get_cart(db, user_id)

    item_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product_id,
        )
    )
    item = item_result.scalar_one_or_none()
    current_quantity = item.quantity if item is not None else 0
    requested_quantity = current_quantity + quantity

    if requested_quantity > product.stock_quantity:
        raise BadRequestException(
            f"Insufficient stock for '{product.name}'. "
            f"Available: {product.stock_quantity}, requested in cart: {requested_quantity}."
        )

    if item is None:
        item = CartItem(product_id=product_id, quantity=quantity)
        # attach item to cart in-memory so the cart.items relationship reflects the change
        cart.items.append(item)
        db.add(item)
    else:
        item.quantity += quantity

    await db.flush()

    # Return a freshly loaded cart (with items and product details) to ensure
    # the newly added/updated item appears in the response.
    refreshed = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    return refreshed.scalar_one()


async def create_order(db: AsyncSession, user_id: int, data: OrderCheckoutCreate):
    """
        Place and Order:
        1. Load the user's cart
        2. Validate each cart item against inventory
        3. Snapshot prices
        4. Deduct stock
        5. Create order + OrderItems
        6. Clear the cart after successful checkout
    """

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise NotFoundException("User", user_id)

    cart_result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items))
    )
    cart = cart_result.scalar_one_or_none()
    if not cart or not cart.items:
        raise BadRequestException("Your cart is empty")

    order_items_data = []
    subtotal = Decimal("0")

    # Now only one request can modify that inventory row at once
    for cart_item in sorted(cart.items, key=lambda item: item.product_id):
        # Load Product 
        result = await db.execute(select(Product).where(
            Product.id == cart_item.product_id,
            Product.is_deleted == False,
            Product.is_active == True
        ).with_for_update()
    )

        product = result.scalar_one_or_none()

        if not product:
            raise NotFoundException("Product", cart_item.product_id)
        
        # Check stock 
        if product.stock_quantity < cart_item.quantity:
            raise BadRequestException(
                f"Insufficient stock for '{product.name}'. "
                f"Available: {product.stock_quantity}, requested: {cart_item.quantity}."
            )
        
        # Snapshot price at order time
        unit_price = product.price 
        total_price = unit_price * cart_item.quantity 
        subtotal += total_price

        # Deduct stock immediately (prevents over-selling)
        product.stock_quantity -= cart_item.quantity

        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": cart_item.quantity,
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

    for cart_item in list(cart.items):
        await db.delete(cart_item)

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
