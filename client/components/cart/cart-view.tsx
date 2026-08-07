import { CartItemsList } from "./cart-items-list"
import { CartSummary } from "./cart-summary"
import type { CartData } from "@/types/cart"

interface CartViewProps {
    cart: CartData | null
}

export function CartView({ cart }: CartViewProps) {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-slate-900">Your cart</h1>
                <p className="mt-2 text-slate-600">Review your selected products and totals before checkout.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <CartItemsList cart={cart} />
                <CartSummary cart={cart} />
            </div>
        </div>
    )
}
