from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import (
    InactiveProductError,
    NotFoundException,
    OutOfStockError,
)
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCheckoutCreate, OrderResponse
from app.services.flash_sale.rules import sale_window_is_open
from app.services.order_factory import create_pending_order


@dataclass(frozen=True)
class CheckoutLine:
    product: Product
    quantity: int
    flash_sale: FlashSale | None
    discounted_quantity: int

    @property
    def discounted_unit_price(self) -> Decimal:
        if self.flash_sale is None:
            return self.product.price
        discount_rate = Decimal(self.flash_sale.discount_percentage) / Decimal("100")
        return self.product.price * (Decimal("1") - discount_rate)

    @property
    def subtotal(self) -> Decimal:
        discounted_total = self.discounted_unit_price * self.discounted_quantity
        regular_quantity = self.quantity - self.discounted_quantity
        return discounted_total + self.product.price * regular_quantity


async def execute_checkout_transaction(
    session: AsyncSession,
    order_repository: OrderRepository,
    request: OrderCheckoutCreate,
    user_id: int,
    cart: Cart,
) -> OrderResponse:
    claimed_items = await _claim_cart_items(session, cart.id)
    if not claimed_items:
        raise NotFoundException("No items in the cart")

    checkout_lines = await _load_checkout_lines(session, user_id, claimed_items)
    subtotal = sum(
        (line.subtotal for line in checkout_lines),
        start=Decimal("0"),
    )
    order = _create_order(request, user_id, subtotal)
    order_repository.add(order)
    await session.flush()

    await _create_order_items_and_reserve_inventory(
        session=session,
        order=order,
        user_id=user_id,
        checkout_lines=checkout_lines,
    )

    await session.flush()
    await session.refresh(order, attribute_names=["items"])
    return OrderResponse.model_validate(order)


async def _claim_cart_items(
    session: AsyncSession,
    cart_id: int,
) -> list[tuple[int, int]]:
    result = await session.execute(
        delete(CartItem)
        .where(CartItem.cart_id == cart_id)
        .returning(CartItem.product_id, CartItem.quantity)
    )
    return [(row.product_id, row.quantity) for row in result.all()]


async def _load_checkout_lines(
    session: AsyncSession,
    user_id: int,
    claimed_items: list[tuple[int, int]],
) -> list[CheckoutLine]:
    checkout_lines: list[CheckoutLine] = []

    # Lock products in a stable order so concurrent checkouts acquire locks consistently.
    for product_id, quantity in sorted(claimed_items):
        product = await _get_locked_product(session, product_id)
        if not product.is_active or product.is_deleted:
            raise InactiveProductError(f"Product {product_id} is inactive")
        if product.stock_quantity < quantity:
            raise OutOfStockError(f"Insufficient stock for product {product_id}")

        flash_sale = await _get_locked_flash_sale(session, product.id)
        discounted_sale = await _get_available_flash_sale(
            session,
            flash_sale,
            user_id,
        )
        checkout_lines.append(
            CheckoutLine(
                product=product,
                quantity=quantity,
                flash_sale=discounted_sale,
                discounted_quantity=1 if discounted_sale is not None else 0,
            )
        )

    return checkout_lines


async def _get_locked_product(session: AsyncSession, product_id: int) -> Product:
    result = await session.execute(
        select(Product)
        .where(Product.id == product_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    product = result.scalars().first()
    if product is None:
        raise NotFoundException(f"Product {product_id} not found")
    return product


async def _get_locked_flash_sale(
    session: AsyncSession,
    product_id: int,
) -> FlashSale | None:
    result = await session.execute(
        select(FlashSale)
        .where(FlashSale.product_id == product_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def _get_available_flash_sale(
    session: AsyncSession,
    flash_sale: FlashSale | None,
    user_id: int,
) -> FlashSale | None:
    if (
        flash_sale is None
        or flash_sale.status not in {"active", "scheduled"}
        or flash_sale.remaining_quantity <= 0
        or not sale_window_is_open(flash_sale)
    ):
        return None

    purchase_result = await session.execute(
        select(FlashSalePurchase)
        .where(
            FlashSalePurchase.flash_sale_id == flash_sale.id,
            FlashSalePurchase.user_id == user_id,
        )
        .with_for_update()
    )
    already_redeemed = purchase_result.scalar_one_or_none() is not None
    return None if already_redeemed else flash_sale


def _create_order(
    request: OrderCheckoutCreate,
    user_id: int,
    subtotal: Decimal,
) -> Order:
    tax = subtotal * Decimal("0.10")
    return create_pending_order(
        user_id=user_id,
        subtotal=subtotal,
        tax=tax,
        shipping_cost=Decimal("0"),
        checkout_details=request,
    )


async def _create_order_items_and_reserve_inventory(
    session: AsyncSession,
    order: Order,
    user_id: int,
    checkout_lines: list[CheckoutLine],
) -> None:
    for line in checkout_lines:
        if line.discounted_quantity:
            await _create_flash_sale_order_item(
                session=session,
                order=order,
                user_id=user_id,
                line=line,
            )

        regular_quantity = line.quantity - line.discounted_quantity
        if regular_quantity:
            session.add(
                OrderItem(
                    order_id=order.id,
                    product_id=line.product.id,
                    product_name=line.product.name,
                    quantity=regular_quantity,
                    unit_price=line.product.price,
                    total_price=line.product.price * regular_quantity,
                    flash_sale_quantity=0,
                )
            )

        await _reserve_product_inventory(session, line)


async def _create_flash_sale_order_item(
    session: AsyncSession,
    order: Order,
    user_id: int,
    line: CheckoutLine,
) -> None:
    flash_sale = line.flash_sale
    if flash_sale is None:
        return

    sale_price = line.discounted_unit_price
    session.add(
        OrderItem(
            order_id=order.id,
            product_id=line.product.id,
            product_name=line.product.name,
            quantity=line.discounted_quantity,
            unit_price=sale_price,
            total_price=sale_price * line.discounted_quantity,
            flash_sale_id=flash_sale.id,
            flash_sale_quantity=line.discounted_quantity,
        )
    )

    sale_update = await session.execute(
        update(FlashSale)
        .where(
            FlashSale.id == flash_sale.id,
            FlashSale.remaining_quantity >= line.discounted_quantity,
        )
        .values(
            remaining_quantity=(
                FlashSale.remaining_quantity - line.discounted_quantity
            )
        )
        .returning(FlashSale.remaining_quantity)
    )
    remaining_quantity = sale_update.scalar_one_or_none()
    if remaining_quantity is None:
        raise OutOfStockError(f"Flash sale {flash_sale.id} sold out")
    flash_sale.remaining_quantity = remaining_quantity

    session.add(
        FlashSalePurchase(
            flash_sale_id=flash_sale.id,
            user_id=user_id,
            order_id=order.id,
            product_id=line.product.id,
            price_paid=sale_price,
            quantity=line.discounted_quantity,
            status=PurchaseStatus.PROCESSING,
        )
    )


async def _reserve_product_inventory(
    session: AsyncSession,
    line: CheckoutLine,
) -> None:
    result = await session.execute(
        update(Product)
        .where(
            Product.id == line.product.id,
            Product.stock_quantity >= line.quantity,
        )
        .values(stock_quantity=Product.stock_quantity - line.quantity)
        .returning(Product.stock_quantity)
    )
    remaining_quantity = result.scalar_one_or_none()
    if remaining_quantity is None:
        raise OutOfStockError(f"Insufficient stock for product {line.product.id}")
    line.product.stock_quantity = remaining_quantity
