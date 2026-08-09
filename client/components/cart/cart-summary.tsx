import { components } from "@/lib/api/schema"
import { CheckoutDialog } from "./checkout-dialog"

type CartItem = components["schemas"]["CartResponse"]

function formatPrice(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "N/A"

    const numberValue = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(numberValue)) return "N/A"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(numberValue)
}

function calculateTaxes(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "N/A"

    const numberValue = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(numberValue)) return "N/A"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(numberValue * 0.10)
}

export function CartSummary({ cart }: {cart: CartItem}) {
    if (!cart) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                Your cart is empty.
            </div>
        )
    }

    const itemCount = cart.items?.reduce((total, item) => total + item.quantity, 0)

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col items-start gap-8 justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Cart summary</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{itemCount} items</h2>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500">Subtotal</p>
                    <p className="text-2xl font-semibold text-slate-900">{formatPrice(cart.subtotal)}</p>
                    <p className="text-2xl font-semibold text-slate-900">Taxes {calculateTaxes(cart.subtotal)}</p>
                </div>
                <CheckoutDialog/>
            </div>
        </div>
    )
}
