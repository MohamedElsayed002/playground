import asyncio
from decimal import Decimal
from datetime import datetime, timezone

import inngest
import stripe
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.product import Product
from app.services.inngest.client import inngest_client, logger


async def release_failed_flash_sale_payment(ctx: inngest.Context) -> None:
	failure_event = ctx.event.data.get("event", {})
	purchase_data = failure_event.get("data", {})
	purchase_id = purchase_data.get("flash_sale_purchase_id")
	if purchase_id is None:
		return

	async with AsyncSessionLocal() as db:
		result = await db.execute(
			select(FlashSalePurchase)
			.where(FlashSalePurchase.id == purchase_id)
			.with_for_update()
		)
		purchase = result.scalar_one_or_none()
		if (
			purchase is None
			or purchase.status != PurchaseStatus.PROCESSING
			or purchase.payment_id is not None
		):
			return

		quantity = purchase.quantity or 1
		sale_result = await db.execute(
			select(FlashSale)
			.where(FlashSale.id == purchase.flash_sale_id)
			.with_for_update()
		)
		sale = sale_result.scalar_one_or_none()
		if sale is not None:
			sale.remaining_quantity = min(
				sale.sale_quantity,
				sale.remaining_quantity + quantity,
			)

		product_result = await db.execute(
			select(Product)
			.where(Product.id == purchase.product_id)
			.with_for_update()
		)
		product = product_result.scalar_one_or_none()
		if product is not None:
			product.stock_quantity += quantity

		purchase.status = PurchaseStatus.FAILED
		if purchase.order_id is not None:
			order_result = await db.execute(
				select(Order)
				.where(Order.id == purchase.order_id)
				.with_for_update()
			)
			order = order_result.scalar_one_or_none()
			if order is not None:
				order.payment_status = PaymentStatus.FAILED
				order.status = OrderStatus.CANCELLED

		await db.commit()


@inngest_client.create_function(
	fn_id="flash-sale-payment",
	trigger=inngest.TriggerEvent(event="flash-sale/payment.requested"),
	retries=3,
	on_failure=release_failed_flash_sale_payment,
)
async def flash_sale_payment(ctx: inngest.Context):
	flash_sale_purchase_id = ctx.event.data["flash_sale_purchase_id"]

	# Step 1
	async def get_flash_sale_purchase():
		async with AsyncSessionLocal() as db:
			result = await db.execute(
				select(FlashSalePurchase).where(
					FlashSalePurchase.id == flash_sale_purchase_id
				)
			)
			purchase = result.scalar_one_or_none()

			if purchase is None:
				raise ValueError(
					f"Flash sale purchase {flash_sale_purchase_id} not found"
				)

			return {
				"flash_sale_purchase_id": purchase.id,
				"payment_id": purchase.payment_id,
				"flash_sale_id": purchase.flash_sale_id,
				"product_id": purchase.product_id,
				"user_id": purchase.user_id,
				"price_paid": str(purchase.price_paid),
				"status": purchase.status.value,
				"order_id": purchase.order_id,
			}

	purchase_data = await ctx.step.run("get-flash-sale-purchase", get_flash_sale_purchase)

	# Step 2
	async def create_payment_intent():
		if not settings.STRIPE_SECRET_KEY:
			raise ValueError("STRIPE_SECRET_KEY is not configured")
		if purchase_data["status"] != PurchaseStatus.PROCESSING.value:
			return {"status": "purchase_not_processing"}

		if purchase_data["order_id"] is not None:
			async with AsyncSessionLocal() as db:
				order_result = await db.execute(
					select(Order).where(Order.id == purchase_data["order_id"])
				)
				order = order_result.scalar_one_or_none()
				if (
					order is None
					or order.status != OrderStatus.PENDING
					or order.payment_status != PaymentStatus.PENDING
					or order.expires_at <= datetime.now(timezone.utc)
				):
					return {"status": "order_expired"}

		# stripe.api_key = settings.STRIPE_SECRET_KEY

		amount_in_cents = int(Decimal(purchase_data["price_paid"]) * 100)

		intent = stripe.PaymentIntent.create(
			amount=amount_in_cents,
			currency="usd",
			automatic_payment_methods={
				"enabled": True
			},
			metadata={
				"flash_sale_purchase_id": str(flash_sale_purchase_id),
				"user_id": purchase_data["user_id"],
				"product_id": purchase_data["product_id"]
			},
			idempotency_key=f"flash-sale-purchase:{flash_sale_purchase_id}"
		)

		async with AsyncSessionLocal() as db:
			result = await db.execute(
				select(FlashSalePurchase).where(
					FlashSalePurchase.id == flash_sale_purchase_id
				).with_for_update()
			)
			purchase = result.scalar_one_or_none()
			if purchase is None:
				raise ValueError(
					f"Flash sale purchase {flash_sale_purchase_id} not found"
				)

			order = None
			if purchase.order_id is not None:
				order_result = await db.execute(
					select(Order)
					.where(Order.id == purchase.order_id)
					.with_for_update()
				)
				order = order_result.scalar_one_or_none()

			if (
				purchase.status != PurchaseStatus.PROCESSING
				or (
					order is not None
					and (
						order.status != OrderStatus.PENDING
						or order.payment_status != PaymentStatus.PENDING
						or order.expires_at <= datetime.now(timezone.utc)
					)
				)
			):
				await db.rollback()
				await asyncio.to_thread(stripe.PaymentIntent.cancel, intent.id)
				return {"status": "order_expired"}

			purchase.payment_id = intent.id
			purchase.stripe_client_secret = intent.client_secret
			await db.commit()

		return {"clientSecret": intent.client_secret, "payment_id": intent.id}

	stripe_payment = await ctx.step.run("create-stripe-payment-intent", create_payment_intent)
	if "clientSecret" not in stripe_payment:
		return {
			"flash_sale_purchase_id": flash_sale_purchase_id,
			**purchase_data,
			**stripe_payment,
		}

	return {
		"flash_sale_purchase_id": flash_sale_purchase_id,
		**purchase_data,
		"payment_id": stripe_payment["payment_id"],
		"client_secret":stripe_payment["clientSecret"],
		"status": "ready_for_payment_handling"
	}
