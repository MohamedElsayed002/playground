"use client"

import { components } from "@/lib/api/schema"
import Link from "next/link"
import {
    formatPrice,
    formatSaleDate,
    getCartPriceBreakdown,
} from "@/lib/cart-pricing"
import { Trash } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { useRemoveItemCart } from "@/hooks/use-add-product-card";

type CartItem = components["schemas"]["CartResponse"]

type CartPricingProps = {
    redeemedSaleIds: ReadonlySet<number>
    isCheckingRedemption: boolean
    isLoggedIn: boolean
}

export function CartItemsList({
    cart,
    redeemedSaleIds,
    isCheckingRedemption,
    isLoggedIn,
}: { cart: CartItem } & CartPricingProps) {

    const { mutate, isPending, isError } = useRemoveItemCart()

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
                const pricing = getCartPriceBreakdown(product, item.quantity, new Date(), {
                    redeemedSaleIds,
                    isCheckingRedemption,
                    isLoggedIn,
                })
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
                                    <Button disabled={isPending} onClick={() => mutate({productId: product.id})} variant="outline" className='hover:bg-red-400 hover:text-white' >
                                        <Trash  size={15}  />
                                    </Button>
                                    <p className="text-lg font-semibold text-slate-900">{formatPrice(pricing.total)}</p>
                                    <p className="text-sm text-slate-500">{item.quantity} item{item.quantity === 1 ? "" : "s"}</p>
                                </div>
                            </div>
                            {pricing.sale && pricing.saleUnitPrice !== null ? (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-semibold">Flash sale: {pricing.sale.discount_percentage}% off 1 item</p>
                                        <p className="font-semibold">{formatPrice(pricing.saleUnitPrice)}</p>
                                    </div>
                                    {pricing.regularQuantity > 0 ? (
                                        <p className="mt-1 text-emerald-800">
                                            {pricing.regularQuantity} item{pricing.regularQuantity === 1 ? "" : "s"} at {formatPrice(pricing.regularUnitPrice)} each
                                        </p>
                                    ) : null}
                                    <p className="mt-1 text-xs text-emerald-700">
                                        Sale ends {formatSaleDate(pricing.sale.ends_at)}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
