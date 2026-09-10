"use client"

import { Elements } from "@stripe/react-stripe-js"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { stripePromise } from "@/lib/stripe"

import { StripePaymentForm } from "./stripe-payment-form"

interface FlashSalePaymentDialogProps {
    clientSecret: string | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function FlashSalePaymentDialog({
    clientSecret,
    isOpen,
    onOpenChange,
    onSuccess,
}: FlashSalePaymentDialogProps) {
    if (!clientSecret) {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Complete your payment</DialogTitle>
                    <DialogDescription>
                        Finish the purchase securely with Stripe.
                    </DialogDescription>
                </DialogHeader>

                <Elements
                    key={clientSecret}
                    stripe={stripePromise}
                    options={{ clientSecret }}
                >
                    <StripePaymentForm onSuccess={onSuccess} />
                </Elements>
            </DialogContent>
        </Dialog>
    )
}
