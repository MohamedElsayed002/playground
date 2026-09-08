"use client"

import type { ProductDetail } from "@/types/products"
import { useEffect, useState } from "react"
import { ProductPurchaseActions } from "./product-purchase-actions"
import { useCheckUser } from "@/hooks/use-add-product-card"

interface ProductDetailsProps {
    product: ProductDetail
}

function formatPrice(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "N/A"

    const numberValue = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(numberValue)) return "N/A"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(numberValue)
}

function formatDate(value?: string | null) {
    if (!value) return "N/A"
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export function ProductDetails({ product }: ProductDetailsProps) {


    const inStock = product.stock_quantity > 0
    const [now, setNow] = useState<number | null>(null)

    useEffect(() => {
        const timer = window.setTimeout(() => setNow(Date.now()), 0)
        return () => window.clearTimeout(timer)
    }, [])

    const activeFlashSale = now === null ? undefined : product.flash_sales?.find((sale) => {
        const startsAt = Date.parse(sale.starts_at)
        const endsAt = Date.parse(sale.ends_at)

        return (
            Number.isFinite(startsAt) &&
            Number.isFinite(endsAt) &&
            startsAt <= now &&
            now <= endsAt &&
            sale.remaining_quantity > 0
        )
    })
    
    const {
        data: hasRedeemed = false,
        isPending: isCheckingRedemption,
        isLoggedIn,
    } = useCheckUser(activeFlashSale?.id ?? null)
    
    const showDiscount = Boolean(
        activeFlashSale && (!isLoggedIn || (!isCheckingRedemption && !hasRedeemed)),
    )
    const regularPrice = Number(product.price)
    const salePrice = showDiscount && activeFlashSale
        ? regularPrice * (1 - activeFlashSale.discount_percentage / 100)
        : regularPrice

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                        {product.is_active ? "Available" : "Inactive"}
                    </span>
                    {product.is_featured && <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">Featured</span>}
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${inStock ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>
                        {inStock ? `${product.stock_quantity} in stock` : "Out of stock"}
                    </span>
                </div>

                <div>
                    <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
                    <p className="mt-2 text-base leading-7 text-slate-600">{product.short_description || product.description || "No short description available."}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-end gap-3">
                    <p className="text-3xl font-semibold text-slate-900">{formatPrice(salePrice)}</p>
                    {showDiscount && activeFlashSale ? (
                        <>
                            <p className="text-lg text-slate-500 line-through">{formatPrice(product.price)}</p>
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                                {activeFlashSale.discount_percentage}% off
                            </span>
                        </>
                    ) : product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                        <p className="text-lg text-slate-500 line-through">{formatPrice(product.compare_at_price)}</p>
                    )}
                </div>

                {showDiscount && activeFlashSale && (
                    <p className="mt-3 text-sm font-medium text-rose-700">
                        Flash sale active until {formatDate(activeFlashSale.ends_at)}. {activeFlashSale.remaining_quantity} discounted purchase{activeFlashSale.remaining_quantity === 1 ? "" : "s"} remaining.
                    </p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm text-slate-500">SKU</p>
                        <p className="font-medium text-slate-900">{product.sku || "N/A"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm text-slate-500">Category ID</p>
                        <p className="font-medium text-slate-900">{product.category_id ?? "N/A"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm text-slate-500">Slug</p>
                        <p className="font-medium text-slate-900">{product.slug}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm text-slate-500">Created</p>
                        <p className="font-medium text-slate-900">{formatDate(product.created_at)}</p>
                    </div>
                </div>

                <ProductPurchaseActions
                    productId={product.id}
                    flashSale={activeFlashSale}
                    isLoggedIn={isLoggedIn}
                    hasRedeemed={Boolean(hasRedeemed)}
                    isCheckingRedemption={isLoggedIn && isCheckingRedemption}
                    disabled={!inStock || !product.is_active}
                />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-semibold text-slate-900">Product description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {product.description || "No detailed description available for this product."}
                </p>
            </div>
        </div>
    )
}
