from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from app.exceptions.handlers import BadRequestException, NotFoundException
from app.schemas.order import OrderCheckoutCreate
from app.services import order_service as service


def result(value=None):
    return SimpleNamespace(scalar_one_or_none=lambda: value, scalar_one=lambda: value)


def checkout_data():
    return OrderCheckoutCreate(shipping_address_line1="1 Main St", shipping_city="Cairo",
                               shipping_country="Egypt", shipping_postal_code="11511")


# Scenario: add to cart rejects nonpositive quantity before database access.
@pytest.mark.asyncio
async def test_add_to_cart_rejects_nonpositive_quantity_before_database_access():
    """Scenario: zero or negative cart quantities are rejected without querying or writing."""
    db = SimpleNamespace(execute=AsyncMock(), add=Mock())
    with pytest.raises(BadRequestException, match="greater than zero"):
        await service.add_to_cart(db, 7, 10, 0)
    db.execute.assert_not_awaited()
    db.add.assert_not_called()


# Scenario: add to cart rejects quantity above available stock.
@pytest.mark.asyncio
async def test_add_to_cart_rejects_quantity_above_available_stock():
    """Scenario: adding a line cannot make the cart quantity exceed current stock."""
    user = object()
    product = SimpleNamespace(id=10, name="Widget", stock_quantity=2)
    cart = SimpleNamespace(id=4, items=[])
    db = SimpleNamespace(execute=AsyncMock(side_effect=[result(user), result(product), result(user), result(cart), result(cart), result(None)]),
                         add=Mock(), flush=AsyncMock())
    # get_cart repeats user lookup, then loads and refreshes the cart.

    with pytest.raises(BadRequestException, match="Insufficient stock"):
        await service.add_to_cart(db, 7, 10, 3)

    db.add.assert_not_called()
    db.flush.assert_not_awaited()


# Scenario: create order rejects empty cart without creating order.
@pytest.mark.asyncio
async def test_create_order_rejects_empty_cart_without_creating_order():
    """Scenario: checkout fails for an empty cart and creates no order."""
    db = SimpleNamespace(execute=AsyncMock(side_effect=[result(object()), result(None)]), add=Mock())
    with pytest.raises(BadRequestException, match="cart is empty"):
        await service.create_order(db, 7, checkout_data())
    db.add.assert_not_called()


# Scenario: create order rejects missing user.
@pytest.mark.asyncio
async def test_create_order_rejects_missing_user():
    """Scenario: a missing user cannot create an order or reserve inventory."""
    db = SimpleNamespace(execute=AsyncMock(return_value=result(None)), add=Mock())
    with pytest.raises(NotFoundException):
        await service.create_order(db, 77, checkout_data())
    db.add.assert_not_called()


# Scenario: create order decrements stock and snapshots price and tax.
@pytest.mark.asyncio
async def test_create_order_decrements_stock_and_snapshots_price_and_tax():
    """Scenario: valid checkout reserves stock and snapshots item prices plus 14% tax."""
    product = SimpleNamespace(id=10, name="Widget", price=Decimal("10.00"), stock_quantity=5,
                              is_active=True, is_deleted=False)
    cart_item = SimpleNamespace(product_id=10, quantity=2)
    cart = SimpleNamespace(items=[cart_item])
    db = SimpleNamespace(
        execute=AsyncMock(side_effect=[result(object()), result(cart), result(product)]),
        add=Mock(), flush=AsyncMock(), refresh=AsyncMock(), delete=AsyncMock(),
    )

    order = await service.create_order(db, 7, checkout_data())

    assert product.stock_quantity == 3
    assert order.subtotal == Decimal("20.00")
    assert order.tax == Decimal("2.8000")
    assert order.total == Decimal("22.8000")
    item = next(call.args[0] for call in db.add.call_args_list if call.args[0].__class__.__name__ == "OrderItem")
    assert (item.product_name, item.quantity, item.unit_price, item.total_price) == (
        "Widget", 2, Decimal("10.00"), Decimal("20.00"),
    )
    db.delete.assert_awaited_once_with(cart_item)
