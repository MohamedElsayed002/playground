import asyncio
from decimal import Decimal

import inngest
import stripe
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.flash_sale import FlashSalePurchase
from app.services.inngest.client import inngest_client, logger

@inngest_client.create_function(
	fn_id="flash-sale-payment",
	trigger=inngest.TriggerEvent(event="flash-sale/payment.requested"),
	retries=3,
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
			}

	purchase_data = await ctx.step.run("get-flash-sale-purchase", get_flash_sale_purchase)

	# Step 2
	async def create_payment_intent():
		if not settings.STRIPE_SECRET_KEY:
			raise ValueError("STRIPE_SECRET_KEY is not configured")

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
				)
			)
			purchase = result.scalar_one_or_none()
			if purchase is None:
				raise ValueError(
					f"Flash sale purchase {flash_sale_purchase_id} not found"
				)

			purchase.payment_id = intent.id
			purchase.stripe_client_secret = intent.client_secret
			await db.commit()

		return {"clientSecret": intent.client_secret, "payment_id": intent.id}

	stripe_payment = await ctx.step.run("create-stripe-payment-intent", create_payment_intent)

	return {
		"flash_sale_purchase_id": flash_sale_purchase_id,
		**purchase_data,
		"payment_id": stripe_payment["payment_id"],
		"client_secret":stripe_payment["clientSecret"],
		"status": "ready_for_payment_handling"
	}
