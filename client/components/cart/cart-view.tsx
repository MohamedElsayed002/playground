"use client"

import { useGetUserCart } from "@/hooks/use-get-user-cart"
import { CartItemsList } from "./cart-items-list"
import { CartSummary } from "./cart-summary"
import type { CartData } from "@/types/cart"
import { Skeleton } from "../ui/skeleton"


export function CartView() {

    const { data, isLoading } = useGetUserCart()

    if (isLoading) {
        return (
            <div className="mx-auto min-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold text-slate-900">Your cart is Loading</h1>
                    <p className="mt-2 text-slate-600">Please wait while we fetch your cart items.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                    <Skeleton className="h-80 w-full bg-gray-300" />
                    <Skeleton className="h-40 w-full bg-gray-300" />
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto min-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-slate-900">Your cart</h1>
                <p className="mt-2 text-slate-600">Review your selected products and totals before checkout.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                {/* @ts-ignore */}
                <CartItemsList cart={data || null} />
                {/* @ts-ignore */}
                <CartSummary cart={data} />
            </div>
        </div>
    )
}
