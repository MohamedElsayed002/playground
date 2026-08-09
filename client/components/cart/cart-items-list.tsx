import { components } from "@/lib/api/schema"
import Link from "next/link"


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

export function CartItemsList({ cart }: { cart: CartItem }) {
    if (!cart || cart.items?.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                Your cart is empty. Add some products to see them here.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {cart.items?.map((item) => {
                const product = item.product
                const imageUrl = product.images?.[0]?.url || "https://placehold.co/600x600/png?text=No+Image"

                return (
                    <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                        <img src={imageUrl} alt={product.name} className="h-24 w-24 rounded-xl object-cover" />

                        <div className="flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <Link href={`/small-ecommerce/${product.slug}`} className="text-lg font-semibold text-slate-900 hover:text-blue-600">
                                        {product.name}
                                    </Link>
                                    <p className="mt-1 text-sm text-slate-600">{product.short_description || product.description || "No description available."}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</p>
                                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
