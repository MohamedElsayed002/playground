"use client"

import { Button } from "@/components/ui/button"
import type { ProductFlashSale } from "@/types/products"

interface FlashSaleDiscountButtonProps {
    flashSale: ProductFlashSale
    disabled: boolean
    loadingClaimDiscount: boolean
    isPaymentPending: boolean
    isPaymentReady: boolean
    isCheckingRedemption: boolean
    paymentError: unknown
    clientSecret: string | null
    onStartCheckout: () => void
}

export function FlashSaleDiscountButton({
    flashSale,
    disabled,
    loadingClaimDiscount,
    isPaymentPending,
    isPaymentReady,
    isCheckingRedemption,
    paymentError,
    clientSecret,
    onStartCheckout,
}: FlashSaleDiscountButtonProps) {
    return (
        <div className="mt-5 space-y-3">
            <Button
                className="w-full bg-rose-600 text-white hover:bg-rose-700"
                disabled={
                    disabled ||
                    loadingClaimDiscount ||
                    isCheckingRedemption ||
                    isPaymentPending
                }
                onClick={onStartCheckout}
            >
                {loadingClaimDiscount
                    ? "Starting checkout..."
                    : isPaymentPending
                        ? "Preparing payment..."
                        : isPaymentReady
                            ? "Open secure payment"
                            : `Claim ${flashSale.discount_percentage}% discount`}
            </Button>

            {paymentError ? (
                <p className="text-center text-xs text-rose-700">
                    We could not prepare the payment session. Please try again.
                </p>
            ) : isPaymentReady && clientSecret ? (
                <p className="text-center text-xs text-emerald-700">
                    Your payment session is ready. The secure Stripe window will open now.
                </p>
            ) : (
                <p className="text-center text-xs text-slate-500">
                    We&apos;ll open Stripe once the payment session is prepared.
                </p>
            )}
        </div>
    )
}
