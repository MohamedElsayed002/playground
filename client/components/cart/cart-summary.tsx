import { components } from "@/lib/api/schema"
import {
    formatPrice,
    formatSaleDate,
    getCartPriceBreakdown,
} from "@/lib/cart-pricing"
import { CheckoutDialog } from "./checkout-dialog"

type CartItem = components["schemas"]["CartResponse"]

export function CartSummary({ cart }: { cart: CartItem }) {
    if (!cart || !cart.items?.length) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
                <p className="mt-2 text-sm text-slate-500">Add some products to see your order summary.</p>
            </div>
        )
    }

    const itemCount = cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
    const pricedItems = cart.items.map((item) => ({
        item,
        pricing: getCartPriceBreakdown(item.product, item.quantity),
    }))
    const subtotalValue = pricedItems.reduce((total, { pricing }) => total + pricing.total, 0)
    const taxesValue = subtotalValue * 0.10
    const calculatedTotal = subtotalValue + taxesValue

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Cart summary</p>
                            <h2 className="text-3xl font-semibold text-slate-950">{itemCount} item{itemCount === 1 ? "" : "s"}</h2>
                        </div>
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                            {cart.items.length} products
                        </div>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-slate-500">
                        Review the items in your cart, check shipping information, and proceed to checkout.
                    </p>
                </div>

                <div className="space-y-4">
                    {pricedItems.map(({ item, pricing }) => (
                        <div
                            key={item.id}
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-base font-semibold text-slate-900">{item.product.name}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {pricing.discountedQuantity > 0 ? (
                                            <>{pricing.discountedQuantity} item at {formatPrice(pricing.saleUnitPrice)}</>
                                        ) : null}
                                        {pricing.discountedQuantity > 0 && pricing.regularQuantity > 0 ? " + " : null}
                                        {pricing.regularQuantity > 0 ? (
                                            <>{pricing.regularQuantity} item{pricing.regularQuantity === 1 ? "" : "s"} at {formatPrice(pricing.regularUnitPrice)}</>
                                        ) : null}
                                    </p>
                                    {pricing.sale ? (
                                        <p className="mt-1 text-xs text-emerald-700">
                                            Flash sale ends {formatSaleDate(pricing.sale.ends_at)}
                                        </p>
                                    ) : null}
                                </div>
                                <p className="text-base font-semibold text-slate-900">
                                    {formatPrice(pricing.total)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-900">{formatPrice(subtotalValue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Estimated taxes</span>
                            <span className="font-medium text-slate-900">{formatPrice(taxesValue)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                            <span>Total</span>
                            <span>{formatPrice(calculatedTotal)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-center sm:justify-between">
                    <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">Need help?</p>
                        <p className="mt-1">Contact support if you have questions before checkout.</p>
                    </div>
                    <div>
                        <CheckoutDialog />
                    </div>
                </div>
            </div>
        </div>
    )
}
