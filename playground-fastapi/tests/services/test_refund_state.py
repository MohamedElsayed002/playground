from types import SimpleNamespace

from app.models.order import OrderStatus, PaymentStatus
from app.models.refund import RefundStatus
from app.services.refund.refund_state import apply_stripe_refund_state


def refund_records():
    refund = SimpleNamespace(status=RefundStatus.PROCESSING, stripe_refund_id=None)
    order = SimpleNamespace(
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
    )
    outbox = SimpleNamespace(status="processing", processed_at=None, last_error=None)
    return refund, order, outbox


def test_stripe_success_updates_refund_order_and_outbox_together():
    refund, order, outbox = refund_records()

    result = apply_stripe_refund_state(
        refund=refund,
        order=order,
        outbox_event=outbox,
        stripe_refund_id="re_succeeded",
        stripe_status="succeeded",
    )

    assert result == "refunded"
    assert refund.status == RefundStatus.REFUNDED
    assert refund.stripe_refund_id == "re_succeeded"
    assert order.status == OrderStatus.REFUNDED
    assert order.payment_status == PaymentStatus.REFUNDED
    assert outbox.status == "processed"
    assert outbox.processed_at is not None
    assert outbox.last_error is None


def test_stripe_terminal_failure_does_not_mark_original_order_refunded():
    refund, order, outbox = refund_records()

    result = apply_stripe_refund_state(
        refund=refund,
        order=order,
        outbox_event=outbox,
        stripe_refund_id="re_failed",
        stripe_status="failed",
        failure_reason="account_closed",
    )

    assert result == "failed"
    assert refund.status == RefundStatus.FAILED
    assert refund.stripe_refund_id == "re_failed"
    assert order.status == OrderStatus.CONFIRMED
    assert order.payment_status == PaymentStatus.PAID
    assert outbox.status == "failed"
    assert outbox.last_error == "account_closed"


def test_stripe_pending_status_stays_processing_for_later_reconciliation():
    refund, order, outbox = refund_records()

    result = apply_stripe_refund_state(
        refund=refund,
        order=order,
        outbox_event=outbox,
        stripe_refund_id="re_pending",
        stripe_status="pending",
    )

    assert result == "processing"
    assert refund.status == RefundStatus.PROCESSING
    assert order.status == OrderStatus.CONFIRMED
    assert order.payment_status == PaymentStatus.PAID
    assert outbox.status == "processing"
    assert outbox.processed_at is None
