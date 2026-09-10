"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAddProductCard, useClaimDiscount } from "@/hooks/use-add-product-card"
import type { ProductFlashSale } from "@/types/products"

import { FlashSaleDiscountButton } from "./flash-sale-discount-button"
import { FlashSalePaymentDialog } from "./flash-sale-payment-dialog"
import { ProductPurchaseFullPrice } from "./product-purchase-full-price"

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
    const router = useRouter()
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

    const {
        mutate: mutateClaimDiscount,
        isPending: loadingClaimDiscount,
        isPaymentPending,
        isPaymentReady,
        payment,
        paymentError,
    } = useClaimDiscount()

    const canClaimDiscount = Boolean(flashSale && (!isLoggedIn || !hasRedeemed))
    const clientSecret = payment?.stripe_client_secret ?? null

    useEffect(() => {
        if (isPaymentReady && clientSecret) {
            const timer = window.setTimeout(() => {
                setIsPaymentDialogOpen(true)
            }, 0)

            return () => window.clearTimeout(timer)
        }
    }, [clientSecret, isPaymentReady])

    function handleStartDiscountCheckout() {
        if (isPaymentReady && clientSecret) {
            setIsPaymentDialogOpen(true)
            return
        }

        mutateClaimDiscount({ flashSaleId: flashSale?.id ?? 0 })
    }

    if (canClaimDiscount && flashSale) {
        return (
            <>
                <FlashSaleDiscountButton
                    flashSale={flashSale}
                    disabled={disabled}
                    loadingClaimDiscount={loadingClaimDiscount}
                    isPaymentPending={isPaymentPending}
                    isPaymentReady={isPaymentReady}
                    isCheckingRedemption={isCheckingRedemption}
                    paymentError={paymentError}
                    clientSecret={clientSecret}
                    onStartCheckout={handleStartDiscountCheckout}
                />

                <FlashSalePaymentDialog
                    clientSecret={clientSecret}
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    onSuccess={() => {
                        setIsPaymentDialogOpen(false)
                        router.refresh()
                    }}
                />
            </>
        )
    }

    return (
        <ProductPurchaseFullPrice
            disabled={disabled}
            loadingAddToCart={loadingAddToCart}
            isCheckingRedemption={isCheckingRedemption}
            onAddToCart={() => mutateAddToCart({ productId, quantity: 1 })}
        />
    )
}
