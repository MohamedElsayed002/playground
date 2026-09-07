"use client"

import { Button } from "@/components/ui/button"
import type { ProductFlashSale } from "@/types/products"
import { useAddProductCard, useClaimDiscount } from "@/hooks/use-add-product-card"

interface ProductPurchaseActionsProps {
    productId: number
    flashSale?: ProductFlashSale
    isLoggedIn: boolean
    hasRedeemed: boolean
    isCheckingRedemption: boolean
    disabled: boolean
}

export function ProductPurchaseActions({
    productId,
    flashSale,
    isLoggedIn,
    hasRedeemed,
    isCheckingRedemption,
    disabled,
}: ProductPurchaseActionsProps) {

    const { mutate: mutateAddToCart, isPending: loadingAddToCart } = useAddProductCard()
    const {
        mutate: mutateClaimDiscount,
        isPending: loadingClaimDiscount,
        isPaymentPending,
        isPaymentReady,
        payment,
    } = useClaimDiscount()

    const canClaimDiscount = Boolean(flashSale && (!isLoggedIn || !hasRedeemed))

    if (canClaimDiscount && flashSale) {
        return (
            <div className="mt-5 space-y-3">
                <Button
                    className="w-full bg-rose-600 text-white hover:bg-rose-700"
                    disabled={disabled || loadingClaimDiscount || isCheckingRedemption}
                    onClick={() => mutateClaimDiscount({ flashSaleId: flashSale.id })}
                >
                    {loadingClaimDiscount
                        ? "Starting checkout..."
                        : isPaymentPending
                            ? "Preparing payment..."
                            : isPaymentReady
                                ? "Payment ready"
                                : `Claim ${flashSale.discount_percentage}% discount`}
                </Button>
                {isPaymentReady && payment?.stripe_client_secret ? (
                    <p className="text-center text-xs text-emerald-700">
                        Payment is ready. Continue to checkout to complete your purchase.
                    </p>
                ) : null}
            </div>
        )
    }

    return (
        <div className="mt-5 space-y-3">
            <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={disabled || loadingAddToCart}
                onClick={() => mutateAddToCart({ productId: productId, quantity: 1 })}
            >
                {isCheckingRedemption
                    ? "Checking discount eligibility..."
                    : loadingAddToCart
                        ? "Adding to cart..."
                        : "Pay full price"}
            </Button>
            <p className="text-center text-xs text-slate-500">
                No active flash sale is available for this product.
            </p>
        </div>
    )
}
