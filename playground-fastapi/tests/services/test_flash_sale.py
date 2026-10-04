"""Business-rule tests for flash-sale setup and redemption."""

from contextlib import asynccontextmanager
import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi.responses import JSONResponse

from app.exceptions.handlers import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    OutOfStockError,
)
from app.models.flash_sale import PurchaseStatus
from app.services.flash_sale.flash_sale_service import FlashSaleService
from app.schemas.flash_sale import CreateFlashSale
import app.services.flash_sale.flash_sale_service as flash_module


def result(value=None, *, mapping=None):
    return SimpleNamespace(
        scalar_one_or_none=lambda: value,
        mappings=lambda: SimpleNamespace(one_or_none=lambda: mapping),
    )


def make_service(monkeypatch, execute_results=()):
    @asynccontextmanager
    async def nested_transaction():
        yield

    session = SimpleNamespace(
        execute=AsyncMock(side_effect=list(execute_results)),
        add=Mock(), add_all=Mock(), flush=AsyncMock(), refresh=AsyncMock(),
        commit=AsyncMock(), begin_nested=Mock(side_effect=nested_transaction),
    )
    monkeypatch.setattr(flash_module, "create_audit_log", AsyncMock())
    monkeypatch.setattr(flash_module, "send_flash_sale_payment_job", AsyncMock())
    return FlashSaleService(session), session


def active_sale(**overrides):
    now = datetime.now(timezone.utc)
    values = dict(
        id=3, product_id=8, starts_at=(now - timedelta(minutes=1)).isoformat(),
        ends_at=(now + timedelta(minutes=1)).isoformat(), discount_percentage=20,
        sale_quantity=1, remaining_quantity=1, status="active",
    )
    values.update(overrides)
    return SimpleNamespace(**values)


def product(**overrides):
    values = dict(id=8, owner_id=5, name="Widget", price=Decimal("50.00"),
                  stock_quantity=4, is_active=True, is_deleted=False)
    values.update(overrides)
    return SimpleNamespace(**values)


def create_data(**overrides):
    now = datetime.now(timezone.utc)
    values = dict(product_id=8, starts_at=now + timedelta(minutes=1),
                  ends_at=now + timedelta(hours=1), discount_percentage=20,
                  sale_quantity=2)
    values.update(overrides)
    return CreateFlashSale(**values)


# Scenario: create flash sale sets scheduled state and full inventory.
@pytest.mark.asyncio
async def test_create_flash_sale_sets_scheduled_state_and_full_inventory(monkeypatch):
    item = product()
    service, session = make_service(monkeypatch, [result(item), result(None)])

    sale = await service.create_flash_sale(5, create_data())

    assert sale.product_id == 8
    assert sale.sale_quantity == sale.remaining_quantity == 2
    assert sale.status == "scheduled"
    session.add.assert_called_once_with(sale)
    session.flush.assert_awaited_once()
    session.refresh.assert_awaited_once_with(sale)


# Scenario: create flash sale requires owned active product.
@pytest.mark.asyncio
@pytest.mark.parametrize("invalid_product", ["missing", "not-owned", "inactive", "deleted"])
async def test_create_flash_sale_requires_owned_active_product(monkeypatch, invalid_product):
    # The ownership/visibility predicates are in the SELECT; model the DB
    # returning no row for every product that fails one of those predicates.
    assert invalid_product in {"missing", "not-owned", "inactive", "deleted"}
    product_row = None
    service, session = make_service(monkeypatch, [result(product_row)])

    with pytest.raises(NotFoundException):
        await service.create_flash_sale(5, create_data())

    session.add.assert_not_called()
    assert session.execute.await_count == 1


# Scenario: create flash sale rejects existing sale and excess quantity.
@pytest.mark.asyncio
async def test_create_flash_sale_rejects_existing_sale_and_excess_quantity(monkeypatch):
    service, session = make_service(monkeypatch, [result(product()), result(object())])
    with pytest.raises(ConflictException):
        await service.create_flash_sale(5, create_data())
    session.add.assert_not_called()

    service, session = make_service(monkeypatch, [result(product(stock_quantity=1)), result(None)])
    with pytest.raises(BadRequestException):
        await service.create_flash_sale(5, create_data(sale_quantity=2))
    session.add.assert_not_called()


# Scenario: redeem replays completed idempotency response without inventory work.
@pytest.mark.asyncio
async def test_redeem_replays_completed_idempotency_response_without_inventory_work(monkeypatch):
    key = SimpleNamespace(response_body='{"purchase_id": 9}')
    service, session = make_service(monkeypatch, [result(key)])

    replay = await service.redeem_sale(3, 5, "repeat")

    assert replay == {"purchase_id": 9, "message": "User already redeemed discount successfully", "success": True}
    assert session.execute.await_count == 1
    flash_module.create_audit_log.assert_awaited_once()
    session.commit.assert_not_awaited()


# Scenario: redeem returns processing for inflight idempotency key.
@pytest.mark.asyncio
async def test_redeem_returns_processing_for_inflight_idempotency_key(monkeypatch):
    key = SimpleNamespace(response_body=None)
    service, session = make_service(monkeypatch, [result(key)])

    response = await service.redeem_sale(3, 5, "inflight")

    assert isinstance(response, JSONResponse)
    assert response.status_code == 202
    assert session.execute.await_count == 1
    session.add.assert_not_called()


# Scenario: redeem rejects duplicate user and sold out sale.
@pytest.mark.asyncio
async def test_redeem_rejects_duplicate_user_and_sold_out_sale(monkeypatch):
    service, session = make_service(monkeypatch, [result(None), result(active_sale()), result(object())])
    with pytest.raises(ConflictException):
        await service.redeem_sale(3, 5, "key")
    assert session.execute.await_count == 3  # stop before product lookup/reservation
    session.commit.assert_not_awaited()

    service, session = make_service(monkeypatch, [result(None), result(active_sale(remaining_quantity=0)), result(None)])
    with pytest.raises(OutOfStockError):
        await service.redeem_sale(3, 5, "key")
    assert session.execute.await_count == 3  # idempotency, sale, then user purchase lookup


@pytest.mark.asyncio
@pytest.mark.parametrize("sale", [
    active_sale(starts_at=(datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()),
    active_sale(ends_at=(datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()),
])
async def test_redeem_rejects_sale_outside_its_time_window(monkeypatch, sale):
    service, session = make_service(monkeypatch, [result(None), result(sale), result(None)])
    with pytest.raises(BadRequestException, match="not currently active"):
        await service.redeem_sale(3, 5, "key")
    assert session.execute.await_count == 3


# Scenario: redeem last flash sale unit race is out of stock.
@pytest.mark.asyncio
async def test_redeem_last_flash_sale_unit_race_is_out_of_stock(monkeypatch):
    service, session = make_service(monkeypatch, [
        result(None), result(active_sale()), result(None), result(product()), result(None),
    ])
    with pytest.raises(OutOfStockError, match="sold out"):
        await service.redeem_sale(3, 5, "key")
    session.commit.assert_not_awaited()
    flash_module.send_flash_sale_payment_job.assert_not_awaited()


# Scenario: redeem product stock race is out of stock.
@pytest.mark.asyncio
async def test_redeem_product_stock_race_is_out_of_stock(monkeypatch):
    service, session = make_service(monkeypatch, [
        result(None), result(active_sale()), result(None), result(product()), result(0), result(None),
    ])
    with pytest.raises(OutOfStockError, match="Product out of the stock"):
        await service.redeem_sale(3, 5, "key")
    session.commit.assert_not_awaited()
    flash_module.send_flash_sale_payment_job.assert_not_awaited()


# Scenario: redeem creates discounted order and dispatches payment job.
@pytest.mark.asyncio
async def test_redeem_creates_discounted_order_and_dispatches_payment_job(monkeypatch):
    sale, item = active_sale(), product()
    service, session = make_service(monkeypatch, [
        result(None), result(sale), result(None), result(item), result(0), result(3),
    ])
    purchase = await service.redeem_sale(3, 5, "new-key")

    assert purchase.price_paid == Decimal("40.00")
    assert purchase.quantity == 1
    assert purchase.status is PurchaseStatus.PROCESSING
    assert item.stock_quantity == 3
    assert sale.remaining_quantity == 0
    order = next(x for x in session.add.call_args_list if x.args and x.args[0].__class__.__name__ == "Order").args[0]
    assert order.subtotal == order.total == Decimal("40.00")
    order_item = session.add_all.call_args.args[0][1]
    assert (order_item.product_name, order_item.unit_price, order_item.flash_sale_id, order_item.flash_sale_quantity) == (
        "Widget", Decimal("40.00"), 3, 1,
    )
    session.commit.assert_awaited_once()
    flash_module.create_audit_log.assert_awaited_once()
    flash_module.send_flash_sale_payment_job.assert_awaited_once_with(flash_sale_purchase_id=purchase.id)


# Scenario: two users compete for last flash sale unit only one redeems.
@pytest.mark.asyncio
async def test_two_users_compete_for_last_flash_sale_unit_only_one_redeems(monkeypatch):
    """Scenario: two users see one sale unit; only one atomic sale reservation succeeds."""
    monkeypatch.setattr(flash_module, "create_audit_log", AsyncMock())
    monkeypatch.setattr(flash_module, "send_flash_sale_payment_job", AsyncMock())
    sale = active_sale()
    item = product(stock_quantity=2)
    both_read_sale = asyncio.Barrier(2)
    sale_lock = asyncio.Lock()
    product_lock = asyncio.Lock()
    def make_racing_service():
        query_index = 0

        @asynccontextmanager
        async def nested_transaction():
            yield

        async def execute(_statement):
            nonlocal query_index
            query_index += 1
            if query_index == 1:  # New, user-scoped idempotency key.
                return result(None)
            if query_index == 2:  # Both requests observe the remaining last sale unit.
                await both_read_sale.wait()
                return result(sale)
            if query_index == 3:  # No previous redemption by this user.
                return result(None)
            if query_index == 4:  # Shared product remains available to either winner.
                return result(item)
            if query_index == 5:  # Atomic UPDATE ... WHERE remaining_quantity >= 1.
                async with sale_lock:
                    if sale.remaining_quantity < 1:
                        return result(None)
                    sale.remaining_quantity -= 1
                    return result(sale.remaining_quantity)
            if query_index == 6:  # Only the sale winner decrements product inventory.
                async with product_lock:
                    if item.stock_quantity < 1:
                        return result(None)
                    item.stock_quantity -= 1
                    return result(item.stock_quantity)
            raise AssertionError(f"Unexpected redemption query #{query_index}")

        session = SimpleNamespace(
            execute=AsyncMock(side_effect=execute), add=Mock(), add_all=Mock(),
            flush=AsyncMock(), refresh=AsyncMock(), commit=AsyncMock(),
            begin_nested=Mock(side_effect=nested_transaction),
        )
        return FlashSaleService(session)

    services = [make_racing_service(), make_racing_service()]

    outcomes = await asyncio.gather(
        services[0].redeem_sale(3, 5, "user-5-key"),
        services[1].redeem_sale(3, 6, "user-6-key"),
        return_exceptions=True,
    )

    assert sum(not isinstance(outcome, Exception) for outcome in outcomes) == 1, repr(outcomes)
    assert sum(isinstance(outcome, OutOfStockError) for outcome in outcomes) == 1
    assert sale.remaining_quantity == 0
    assert item.stock_quantity == 1
    assert sum(service.session.commit.await_count for service in services) == 1
    assert flash_module.send_flash_sale_payment_job.await_count == 1
