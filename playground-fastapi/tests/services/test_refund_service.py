import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

# Importing the service creates its app engine, whose PostgreSQL-style pool
# settings are incompatible with SQLite's in-memory StaticPool.
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost/test"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
os.environ.setdefault("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")
os.environ.setdefault("BUCKET_NAME", "test-bucket")
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai")
os.environ.setdefault("RESEND_API_KEY", "test-resend")
os.environ.setdefault("WORKOS_ORGANIZATION_ID", "org-test")
os.environ.setdefault("WORKOS_CLIENT_ID", "client-test")
os.environ.setdefault("WORKOS_API_KEY", "api-test")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_placeholder")
os.environ.setdefault("STRIPE_PUBLISHABLE_KEY", "pk_test_placeholder")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_placeholder")
os.environ.setdefault("DISCORD_ORDER_WEBHOOK_URL", "https://example.test/webhook")

import pytest
from fastapi.responses import JSONResponse
import stripe

from app.exceptions.handlers import BadRequestException
from app.models.order import OrderStatus, PaymentStatus
from app.models.refund import RefundStatus
from app.services.refund import refund_service as service_module


def db_result(value):
    return SimpleNamespace(scalar_one_or_none=lambda: value)


def make_order(*, created_at=None):
    return SimpleNamespace(
        id=41,
        user_id=7,
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
        payment_id="pi_test_41",
        total=Decimal("125.00"),
        created_at=created_at or datetime.now(timezone.utc) - timedelta(days=1),
        order_number="ORD-41",
    )


def make_session(*, order=None, existing_refund=None, outbox=None, timeline=None):
    state = {"refund": existing_refund, "outbox": outbox, "added": []}
    timeline = timeline if timeline is not None else []

    async def execute(statement):
        query = str(statement)
        if "FROM idempotency_keys" in query:
            return db_result(None)
        if "FROM orders" in query:
            return db_result(order)
        if "FROM refunds" in query:
            return db_result(state["refund"])
        if "FROM audit_outbox" in query:
            return db_result(state["outbox"])
        raise AssertionError(f"Unexpected query: {query}")

    def add_all(rows):
        state["added"].extend(rows)
        for row in rows:
            if row.__class__.__name__ == "Refund":
                state["refund"] = row
            elif row.__class__.__name__ == "AuditOutbox":
                row.id = row.id or uuid4()
                state["outbox"] = row

    session = SimpleNamespace(
        execute=AsyncMock(side_effect=execute),
        add=Mock(),
        add_all=Mock(side_effect=add_all),
        flush=AsyncMock(side_effect=lambda: timeline.append("flush")),
        commit=AsyncMock(side_effect=lambda: timeline.append("commit")),
        rollback=AsyncMock(side_effect=lambda: timeline.append("rollback")),
    )
    return session, state


@pytest.mark.asyncio
async def test_ten_requests_with_different_keys_create_one_refund_and_one_outbox_event(monkeypatch):
    """Order locking and the order unique constraint prevent duplicate refund rows."""
    timeline = []
    order = make_order()
    session, state = make_session(order=order, timeline=timeline)
    send_refund = AsyncMock(side_effect=lambda *_args: timeline.append("send"))
    monkeypatch.setattr(service_module, "send_refund_job", send_refund)
    service = service_module.RefundService(session)

    responses = [
        await service.refund_logic(f"click-{index}", user_id=7, order_id=41)
        for index in range(10)
    ]

    assert all(isinstance(response, JSONResponse) for response in responses)
    assert all(response.status_code == 202 for response in responses)
    assert [row for row in state["added"] if row.__class__.__name__ == "Refund"] == [state["refund"]]
    assert [row for row in state["added"] if row.__class__.__name__ == "AuditOutbox"] == [state["outbox"]]
    assert state["refund"].amount == Decimal("100.0000")
    assert state["refund"].status == RefundStatus.PROCESSING
    order_select = session.execute.await_args_list[1].args[0]
    assert order_select._for_update_arg is not None
    assert session.commit.await_count == 1
    assert timeline.index("commit") < timeline.index("send")
    assert send_refund.await_count == 10


@pytest.mark.asyncio
async def test_existing_terminal_failure_is_returned_without_republishing(monkeypatch):
    """A terminal Stripe failure is surfaced and is not restarted by another click."""
    failed_refund = SimpleNamespace(status=RefundStatus.FAILED)
    failed_outbox = SimpleNamespace(id=uuid4(), status="failed")
    session, _ = make_session(
        order=make_order(), existing_refund=failed_refund, outbox=failed_outbox
    )
    send_refund = AsyncMock()
    monkeypatch.setattr(service_module, "send_refund_job", send_refund)

    response = await service_module.RefundService(session).refund_logic(
        "new-key-after-failure", user_id=7, order_id=41
    )

    assert response.status_code == 200
    assert b'"status":"failed"' in response.body
    assert b'"success":false' in response.body
    send_refund.assert_not_awaited()
    session.add_all.assert_not_called()


@pytest.mark.asyncio
async def test_expired_refund_request_creates_no_refund_or_outbox(monkeypatch):
    session, _ = make_session(
        order=make_order(created_at=datetime.now(timezone.utc) - timedelta(days=31))
    )
    monkeypatch.setattr(service_module, "send_refund_job", AsyncMock())

    with pytest.raises(BadRequestException, match="30-day refund period"):
        await service_module.RefundService(session).refund_logic(
            "expired-key", user_id=7, order_id=41
        )

    session.add_all.assert_not_called()
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_inngest_send_failure_keeps_committed_refund_for_retry(monkeypatch):
    """A dispatch outage after commit leaves a durable refund that a retry reuses."""
    timeline = []
    session, state = make_session(order=make_order(), timeline=timeline)
    send_refund = AsyncMock(
        side_effect=[RuntimeError("Inngest unavailable"), None]
    )
    monkeypatch.setattr(service_module, "send_refund_job", send_refund)
    refund_service = service_module.RefundService(session)

    with pytest.raises(RuntimeError, match="Inngest unavailable"):
        await refund_service.refund_logic("stable-key", user_id=7, order_id=41)

    assert session.commit.await_count == 1
    assert state["refund"].status == RefundStatus.PROCESSING
    assert state["outbox"].status == "pending"

    retry_response = await refund_service.refund_logic(
        "stable-key", user_id=7, order_id=41
    )

    assert retry_response.status_code == 202
    assert session.add_all.call_count == 1
    assert session.commit.await_count == 1
    assert send_refund.await_count == 2


@pytest.mark.asyncio
async def test_reconciliation_stripe_lookup_error_does_not_fail_refund(monkeypatch):
    """A Stripe API error is deferred; it does not change local refund state."""
    from app.services.inngest.functions import reconcile_refunds

    class CandidateResult:
        def all(self):
            return [(9, 41, "re_pending")]

    class FakeSession:
        def __init__(self):
            self.execute = AsyncMock(return_value=CandidateResult())
            self.commit = AsyncMock()

    class SessionContext:
        def __init__(self, session):
            self.session = session

        async def __aenter__(self):
            return self.session

        async def __aexit__(self, *_args):
            return None

    session = FakeSession()
    monkeypatch.setattr(
        reconcile_refunds,
        "AsyncSessionLocal",
        lambda: SessionContext(session),
    )
    monkeypatch.setattr(
        reconcile_refunds.stripe.Refund,
        "retrieve",
        Mock(side_effect=stripe.error.StripeError("temporary Stripe error")),
    )

    async def run_step(_name, callback):
        return await callback()

    ctx = SimpleNamespace(step=SimpleNamespace(run=run_step))
    result = await reconcile_refunds.reconcile_order_refunds._handler(ctx)

    assert result["deferred_stripe_errors"] == 1
    assert result["failed"] == 0
    assert result["succeeded"] == 0
    assert session.execute.await_count == 1
    session.commit.assert_not_awaited()
