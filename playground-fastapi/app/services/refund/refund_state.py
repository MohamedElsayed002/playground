from datetime import datetime, timezone

from app.models.audit_outbox import AuditOutbox
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.refund import Refund, RefundStatus


def apply_stripe_refund_state(
    *,
    refund: Refund,
    order: Order,
    outbox_event: AuditOutbox,
    stripe_refund_id: str,
    stripe_status: str,
    failure_reason: str | None = None,
) -> str:
    """Apply an authoritative Stripe refund status to the local records."""
    refund.stripe_refund_id = stripe_refund_id

    if stripe_status == "succeeded":
        refund.status = RefundStatus.REFUNDED
        order.status = OrderStatus.REFUNDED
        order.payment_status = PaymentStatus.REFUNDED
        outbox_event.status = "processed"
        outbox_event.processed_at = datetime.now(timezone.utc)
        outbox_event.last_error = None
        return "refunded"

    if stripe_status in {"failed", "canceled"}:
        refund.status = RefundStatus.FAILED
        outbox_event.status = "failed"
        outbox_event.processed_at = datetime.now(timezone.utc)
        outbox_event.last_error = failure_reason or f"Stripe refund {stripe_status}"
        # The original order remains paid because no refund completed.
        return "failed"

    # pending / requires_action are not failures. A Stripe API retrieval error
    # must not call this helper, so it cannot change any persisted status.
    refund.status = RefundStatus.PROCESSING
    outbox_event.status = "needs_action" if stripe_status == "requires_action" else "processing"
    outbox_event.last_error = (
        failure_reason if stripe_status == "requires_action" else None
    )
    return "processing"
