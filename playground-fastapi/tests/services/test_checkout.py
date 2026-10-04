from datetime import datetime, timezone 
import asyncio
from contextlib import asynccontextmanager
from decimal import Decimal 
from types import SimpleNamespace 
from unittest.mock import AsyncMock, Mock

import pytest
from sqlalchemy.exc import IntegrityError

from app.exceptions.handlers import ConflictException, NotFoundException, OutOfStockError
from app.models.cart import Cart
from app.models.order import OrderStatus, PaymentStatus
from app.services.checkout.create_checkout import checkout_service_2 as checkout_module
from app.services.checkout.create_checkout.checkout_service_2 import CheckoutService

from app.models.product import Product

def db_result(value=None, *, values=None):
    return SimpleNamespace(
        scalar_one_or_none=lambda: value,
        scalars=lambda: iter(values or [])
    )


def db_rows(rows):
    return SimpleNamespace(all=lambda: rows)


def claimed_lines(*items):
    return db_rows([
        SimpleNamespace(id=index, product_id=item.product_id, quantity=item.quantity)
        for index, item in enumerate(items, start=1)
    ])


def product_result(value):
    return SimpleNamespace(
        scalars=lambda: SimpleNamespace(first=lambda: value),
        scalar_one_or_none=lambda: value
    )


def response():
    now = datetime.now(timezone.utc)

    return checkout_module.OrderResponse(
        id=42,
        order_number="ORD-20261003-1234",
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        subtotal=Decimal("20.00"),
        shipping_cost=Decimal("0.00"),
        tax=Decimal("2.00"),
        total=Decimal("22.00"),
        shipping_address_line1="1 Main St",
        shipping_address_line2=None,
        shipping_city="Cairo",
        shipping_country="Egypt",
        shipping_postal_code="11511",
        notes=None,
        user_id=7,
        items=[],
        created_at=now,
        updated_at=now,
    )


def order(*, status=OrderStatus.PENDING, payment_status=PaymentStatus.PENDING, items=None):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=42,
        user_id=7,
        order_number="ORD-20261003-1234",
        status=status,
        payment_status=payment_status,
        subtotal=Decimal("20.00"),
        shipping_cost=Decimal("0.00"),
        tax=Decimal("2.00"),
        total=Decimal("22.00"),
        shipping_address_line1="1 Main St",
        shipping_address_line2=None,
        shipping_city="Cairo",
        shipping_country="Egypt",
        shipping_postal_code="11511",
        notes=None,
        items=items or [],
        created_at=now,
        updated_at=now, 
    )


def service_with_cart(monkeypatch, *, cart_items=None):
    session = SimpleNamespace(
        execute=AsyncMock(return_value=db_result(SimpleNamespace(
            items=[object()] if cart_items is None else cart_items
        ))),
        commit=AsyncMock(),
        rollback=AsyncMock(),
        add=Mock(),
        flush=AsyncMock(),
        refresh=AsyncMock(),
        delete=AsyncMock(),
    )
    service = CheckoutService(session)
    service.order_repo = SimpleNamespace(
        add=Mock(), get_with_items=AsyncMock()
    )
    service.idempotency_repo = SimpleNamespace(
        get_by_key=AsyncMock(return_value=None),
        create_lock=AsyncMock(return_value=SimpleNamespace(id=1)),
        complete=AsyncMock(),
    )
    monkeypatch.setattr(checkout_module, "create_audit_log", AsyncMock())
    monkeypatch.setattr(service, "_execute_checkout_2", AsyncMock(return_value=response()))
    return service

def checkout_request():
    return checkout_module.OrderCheckoutCreate(
        shipping_address_line1="1 Main St",
        shipping_city="Cairo",
        shipping_country="Egypt",
        shipping_postal_code="27818"
    )

# Scenario: checkout rejects missing cart.
@pytest.mark.asyncio
async def test_checkout_rejects_missing_cart(monkeypatch):
    service = service_with_cart(monkeypatch)
    service.session.execute.return_value = db_result(None)

    with pytest.raises(NotFoundException,match="No items in the cart"):
        await service.checkout_2("key",7, checkout_request())

    service.idempotency_repo.create_lock.assert_not_awaited()
    service.session.commit.assert_not_awaited()



# Scenario: checkout rejects empty cart.
@pytest.mark.asyncio 
async def test_checkout_rejects_empty_cart(monkeypatch):
    service = service_with_cart(monkeypatch, cart_items=[])
    service._execute_checkout_2.side_effect = NotFoundException("No items in the cart")

    with pytest.raises(NotFoundException, match="No items in the cart"):
        await service.checkout_2("key",7,checkout_request())

    service.idempotency_repo.get_by_key.assert_awaited_once()
    service.idempotency_repo.create_lock.assert_awaited_once()
    service.session.rollback.assert_awaited_once()


# Scenario: checkout returns completed idempotent response.
@pytest.mark.asyncio
async def test_checkout_returns_completed_idempotent_response(monkeypatch):
    service = service_with_cart(monkeypatch)

    replay = response()
    service.idempotency_repo.get_by_key.return_value = SimpleNamespace(
        is_complete=lambda: True,
        response_body=replay.model_dump_json()
    )

    result = await service.checkout_2("key",7, checkout_request())

    assert result.id == replay.id 
    service.idempotency_repo.create_lock.assert_not_awaited()
    service.session.commit.assert_not_awaited()


# Duplicate Idempotency key test
# Scenario: checkout maps concurrent idempotency claim to conflict.
@pytest.mark.asyncio
async def test_checkout_maps_concurrent_idempotency_claim_to_conflict(monkeypatch):
    service = service_with_cart(monkeypatch)

    service.idempotency_repo.create_lock.side_effect = IntegrityError(
        "insert", {}, Exception("unique key")
    )

    with pytest.raises(ConflictException, match="Duplicate Idempotency key"):
        await service.checkout_2("same-key",7,checkout_request())

    service.session.rollback.assert_awaited_once()
    service._execute_checkout_2.assert_not_awaited()


# stock quantity changed
# Scenario: checkout rolls back when atomic checkout transactions fails.
@pytest.mark.asyncio 
async def test_checkout_rolls_back_when_atomic_checkout_transactions_fails(monkeypatch):
    service = service_with_cart(monkeypatch)
    service._execute_checkout_2.side_effect = RuntimeError("stock changed")

    with pytest.raises(RuntimeError, match="stock changed"):
        await service.checkout_2("key",7,checkout_request())

    service.session.rollback.assert_awaited_once()
    service.session.commit.assert_not_awaited()
    service.order_repo.get_with_items.assert_not_awaited()


# Payment confirmation is asynchronous; checkout only creates a pending order.
@pytest.mark.asyncio
async def test_checkout_returns_pending_order_and_completes_idempotency_key(monkeypatch):
    service = service_with_cart(monkeypatch)
    record = SimpleNamespace(id=1)
    service.idempotency_repo.create_lock.return_value = record
    pending = order()
    service.order_repo.get_with_items.return_value = pending
    jobs = AsyncMock()
    monkeypatch.setattr(checkout_module, "send_checkout_background_jobs", jobs)

    result = await service.checkout_2("key", 7, checkout_request())

    assert result.status is OrderStatus.PENDING
    assert result.payment_status is PaymentStatus.PENDING
    assert service.session.commit.await_count == 2
    service.idempotency_repo.complete.assert_awaited_once()
    assert service.idempotency_repo.complete.await_args.kwargs["status_code"] == 201
    assert "pending" in service.idempotency_repo.complete.await_args.kwargs["response_body"]
    jobs.assert_awaited_once()
    assert jobs.await_args.kwargs["payment_status"] == PaymentStatus.PENDING.value


@pytest.mark.asyncio
async def test_checkout_does_not_compensate_inventory_before_webhook(monkeypatch):
    service = service_with_cart(monkeypatch)
    pending = order()
    product = SimpleNamespace(stock_quantity=3)
    service.order_repo.get_with_items.return_value = pending
    jobs = AsyncMock()
    monkeypatch.setattr(checkout_module, "send_checkout_background_jobs", jobs)

    result = await service.checkout_2(None, 7, checkout_request())

    assert product.stock_quantity == 3
    assert pending.status is OrderStatus.PENDING
    assert pending.payment_status is PaymentStatus.PENDING
    assert result.status is OrderStatus.PENDING
    # Only the cart lookup runs here; inventory compensation belongs to webhook handling.
    service.session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_checkout_does_not_change_an_order_already_cancelled(monkeypatch):
    service = service_with_cart(monkeypatch)
    cancelled = order(status=OrderStatus.CANCELLED, payment_status=PaymentStatus.FAILED)
    service.order_repo.get_with_items.return_value = cancelled
    monkeypatch.setattr(checkout_module, "send_checkout_background_jobs", AsyncMock())

    result = await service.checkout_2(None, 7, checkout_request())

    service.session.execute.assert_awaited_once()
    assert cancelled.payment_status is PaymentStatus.FAILED
    assert cancelled.status is OrderStatus.CANCELLED
    assert result.status is OrderStatus.CANCELLED


@pytest.mark.asyncio
async def test_checkout_fails_if_order_disappears_after_checkout_commit(monkeypatch):
    service = service_with_cart(monkeypatch)
    service.order_repo.get_with_items.return_value = None

    with pytest.raises(NotFoundException, match="Order not found"):
        await service.checkout_2("key", 7, checkout_request())

    service.session.commit.assert_awaited_once()
    service.session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_checkout_rolls_back_if_pending_idempotency_cache_commit_fails(monkeypatch):
    service = service_with_cart(monkeypatch)
    service.order_repo.get_with_items.return_value = order()
    service.session.commit.side_effect = [None, RuntimeError("cache commit failed")]
    monkeypatch.setattr(checkout_module, "send_checkout_background_jobs", AsyncMock())

    with pytest.raises(RuntimeError, match="cache commit failed"):
        await service.checkout_2("key", 7, checkout_request())

    service.session.rollback.assert_awaited_once()
    service.order_repo.get_with_items.assert_awaited_once()


@pytest.mark.asyncio
async def test_checkout_ignores_noncritical_background_job_failure(monkeypatch):
    service = service_with_cart(monkeypatch)
    pending = order()
    service.order_repo.get_with_items.return_value = pending
    jobs = AsyncMock(side_effect=RuntimeError("queue unavailable"))
    monkeypatch.setattr(checkout_module, "send_checkout_background_jobs", jobs)

    result = await service.checkout_2("key", 7, checkout_request())

    assert result.status is OrderStatus.PENDING
    assert result.payment_status is PaymentStatus.PENDING
    assert service.session.commit.await_count == 2
    service.idempotency_repo.complete.assert_awaited_once()


@pytest.mark.asyncio
async def test_checkout_without_idempotency_key_dispatches_pending_payment(monkeypatch):
    service = service_with_cart(monkeypatch)
    service.order_repo.get_with_items.return_value = order()
    jobs = AsyncMock()
    monkeypatch.setattr(checkout_module, "send_checkout_background_jobs", jobs)

    result = await service.checkout_2(None, 7, checkout_request())

    assert result.payment_status is PaymentStatus.PENDING
    service.idempotency_repo.get_by_key.assert_not_awaited()
    service.idempotency_repo.create_lock.assert_not_awaited()
    service.idempotency_repo.complete.assert_not_awaited()
    jobs.assert_awaited_once()


# Scenario: core checkout rejects product deleted between cart and checkout.
@pytest.mark.asyncio
async def test_core_checkout_rejects_product_deleted_between_cart_and_checkout(monkeypatch):
    service = service_with_cart(monkeypatch)
    del service._execute_checkout_2
    cart_item = SimpleNamespace(product_id=10,quantity=1)
    cart = SimpleNamespace(id=1, items=[cart_item])
    service.session.execute.side_effect = [claimed_lines(cart_item), product_result(None)]

    with pytest.raises(NotFoundException, match="Product 10 not found"):
        await service._execute_checkout_2(checkout_request(),7,cart)

    service.order_repo.add.asset_not_called()


# Scenario: core checkout rejects inactive or deleted product.
@pytest.mark.asyncio
@pytest.mark.parametrize("is_active,is_deleted", [(False, False), (True, True)])
async def test_core_checkout_rejects_inactive_or_deleted_product(monkeypatch, is_active, is_deleted):
    from app.exceptions.handlers import InactiveProductError

    service = service_with_cart(monkeypatch)
    del service._execute_checkout_2
    product = SimpleNamespace(
        id=10, is_active=is_active, is_deleted=is_deleted, stock_quantity=4
    )
    cart_item = SimpleNamespace(product_id=10, quantity=1)
    service.session.execute.side_effect = [claimed_lines(cart_item), product_result(product)]

    with pytest.raises(InactiveProductError, match="is inactive"):
        await service._execute_checkout_2(
            checkout_request(), 7, SimpleNamespace(id=1, items=[cart_item])
        )

    service.order_repo.add.assert_not_called()


# Scenario: core checkout rejects stock insufficient at locked read.
@pytest.mark.asyncio 
async def test_core_checkout_rejects_stock_insufficient_at_locked_read(monkeypatch):
    service = service_with_cart(monkeypatch)
    del service._execute_checkout_2

    product = SimpleNamespace(
        id=10,
        name="Widget",
        price=Decimal("10.00"),
        is_active=True,
        is_deleted=False,
        stock_quantity=1
    )

    cart_item = SimpleNamespace(product_id=10, quantity=2)
    service.session.execute.side_effect = [
        claimed_lines(cart_item),
        product_result(product),
    ]

    cart = SimpleNamespace(id=1, items=[cart_item])

    with pytest.raises(OutOfStockError, match="Insufficient stock for product 10"):
        await service._execute_checkout_2(checkout_request(), 7, cart)

    assert service.session.execute.await_count == 2
    service.order_repo.add.assert_not_called()


# Scenario: two checkouts compete for one product unit only one succeeds.
@pytest.mark.asyncio
async def test_two_checkouts_compete_for_one_product_unit_only_one_succeeds(monkeypatch):
    """Scenario: two users read the last unit; the atomic decrement admits one."""
    from app.exceptions.handlers import OutOfStockError

    product = SimpleNamespace(
        id=10, name="Widget", price=Decimal("10.00"), is_active=True,
        is_deleted=False, stock_quantity=1,
    )
    both_read_stock = asyncio.Barrier(2)
    decrement_lock = asyncio.Lock()

    def concurrent_service(user_id):
        call_number = 0

        async def execute(_statement):
            nonlocal call_number
            call_number += 1
            if call_number == 1:  # Atomically claim this user's cart line.
                return claimed_lines(SimpleNamespace(product_id=10, quantity=1))
            if call_number == 2:  # Both users observe stock=1 before either decrements.
                await both_read_stock.wait()
                return product_result(product)
            if call_number == 3:  # No flash sale applies to this checkout.
                return db_result(None)
            if call_number == 4:  # Model UPDATE ... WHERE stock >= 1 RETURNING atomically.
                async with decrement_lock:
                    if product.stock_quantity < 1:
                        return db_result(None)
                    product.stock_quantity -= 1
                    return db_result(product.stock_quantity)
            raise AssertionError(f"Unexpected checkout query #{call_number}")

        session = SimpleNamespace(
            execute=AsyncMock(side_effect=execute), add=Mock(), add_all=Mock(),
            flush=AsyncMock(), refresh=AsyncMock(), delete=AsyncMock(),
        )
        service = CheckoutService(session)
        service.order_repo = SimpleNamespace(add=Mock())
        return service

    # Core checkout returns a validated schema in production; keep this test
    # focused on concurrent inventory reservation rather than response fields.
    monkeypatch.setattr(checkout_module.OrderResponse, "model_validate", classmethod(lambda cls, _obj: object()))
    carts = [
        SimpleNamespace(id=user_id, items=[SimpleNamespace(product_id=10, quantity=1)])
        for user_id in (7, 8)
    ]
    services = [concurrent_service(user_id) for user_id in (7, 8)]

    outcomes = await asyncio.gather(*(
        service._execute_checkout_2(checkout_request(), user_id, cart)
        for service, user_id, cart in zip(services, (7, 8), carts)
    ), return_exceptions=True)

    assert sum(not isinstance(outcome, Exception) for outcome in outcomes) == 1
    assert sum(isinstance(outcome, OutOfStockError) for outcome in outcomes) == 1
    assert product.stock_quantity == 0


# Scenario: 100 concurrent requests from one user must consume the same cart once.
@pytest.mark.asyncio
async def test_100_concurrent_checkouts_consume_same_cart_once(monkeypatch):
    """Exercise checkout with separate request sessions and one shared cart.

    The fake database snapshots Cart.items when each Cart SELECT completes,
    honors SELECT FOR UPDATE when present, and releases that lock on commit.
    The real _execute_checkout_2() path handles product validation, order
    creation, stock decrement, and cart-item deletion.
    """
    product = SimpleNamespace(
        id=10,
        name="Widget",
        price=Decimal("10.00"),
        is_active=True,
        is_deleted=False,
        stock_quantity=3,
    )
    cart_item = SimpleNamespace(id=1, product_id=10, quantity=1)
    shared_cart = SimpleNamespace(id=1, items=[cart_item])
    cart_lock = asyncio.Lock()
    product_lock = asyncio.Lock()
    orders_created = 0

    class RequestSession:
        def __init__(self):
            self.holds_cart_lock = False
            self.claimed_items = []
            self.execute = AsyncMock(side_effect=self._execute)
            self.commit = AsyncMock(side_effect=self._commit)
            self.rollback = AsyncMock(side_effect=self._rollback)
            self.add = Mock()
            self.flush = AsyncMock()
            self.refresh = AsyncMock()
            self.delete = AsyncMock(side_effect=self._delete)

        async def _execute(self, statement):
            descriptions = getattr(statement, "column_descriptions", [])
            entity = descriptions[0].get("entity") if descriptions else None
            if entity is Cart:
                if statement._for_update_arg is not None:
                    await cart_lock.acquire()
                    self.holds_cart_lock = True
                loaded_cart = SimpleNamespace(
                    id=shared_cart.id, items=list(shared_cart.items)
                )
                return db_result(loaded_cart)
            if entity is Product:
                if statement._for_update_arg is not None:
                    await product_lock.acquire()
                    self.holds_product_lock = True
                return product_result(product)
            if entity is checkout_module.FlashSale:
                return db_result(None)
            if getattr(statement, "table", None) is not None and statement.table.name == "cart_items":
                self.claimed_items = list(shared_cart.items)
                shared_cart.items.clear()
                return db_rows([
                    SimpleNamespace(
                        id=item.id,
                        product_id=item.product_id,
                        quantity=item.quantity,
                    )
                    for item in self.claimed_items
                ])
            if getattr(statement, "table", None) is not None and statement.table.name == "products":
                if product.stock_quantity < 1:
                    return db_result(None)
                product.stock_quantity -= 1
                return db_result(product.stock_quantity)
            raise AssertionError(f"Unexpected SQL statement: {statement}")

        async def _delete(self, item):
            if item in shared_cart.items:
                shared_cart.items.remove(item)

        async def _commit(self):
            self.claimed_items = []
            await self._release_locks()

        async def _rollback(self):
            shared_cart.items[:0] = self.claimed_items
            self.claimed_items = []
            await self._release_locks()

        async def _release_locks(self):
            if self.holds_cart_lock:
                self.holds_cart_lock = False
                cart_lock.release()
            if self.holds_product_lock:
                self.holds_product_lock = False
                product_lock.release()

        def _add(self, instance):
            nonlocal orders_created
            if hasattr(instance, "order_number"):
                orders_created += 1
                instance.id = orders_created

    monkeypatch.setattr(checkout_module, "create_audit_log", AsyncMock())
    monkeypatch.setattr(
        "app.services.inngest.send_checkout_background_jobs", AsyncMock()
    )
    monkeypatch.setattr(
        checkout_module.OrderResponse,
        "model_validate",
        classmethod(lambda cls, _obj: response()),
    )

    def make_service():
        session = RequestSession()
        session.holds_product_lock = False
        session.add = Mock(side_effect=session._add)
        service = CheckoutService(session)
        service.order_repo = SimpleNamespace(
            add=session.add, get_with_items=AsyncMock(return_value=order())
        )
        service.idempotency_repo = SimpleNamespace(
            get_by_key=AsyncMock(return_value=None),
            create_lock=AsyncMock(return_value=SimpleNamespace(id=1)),
            complete=AsyncMock(),
        )
        return service

    services = [make_service() for _ in range(100)]
    outcomes = await asyncio.gather(
        *(
            run_checkout_request(service, f"key-{index}")
            for index, service in enumerate(services)
        ),
        return_exceptions=True,
    )

    assert sum(not isinstance(result, Exception) for result in outcomes) == 1, [
        f"{type(result).__name__}: {result}"
        for result in outcomes
        if isinstance(result, Exception)
    ]
    assert sum(isinstance(result, NotFoundException) for result in outcomes) == 99
    assert orders_created == 1
    assert shared_cart.items == []
    assert product.stock_quantity == 2


async def run_checkout_request(service, key):
    """Mirror get_db() rollback on request failure, including empty cart."""
    try:
        return await service.checkout_2(key, 7, checkout_request())
    except Exception:
        await service.session.rollback()
        raise
