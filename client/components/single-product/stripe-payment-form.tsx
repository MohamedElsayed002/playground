"use client"

import { type FormEvent, useState } from "react"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface StripePaymentFormProps {
    onSuccess: () => void
}

export function StripePaymentForm({ onSuccess }: StripePaymentFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsSubmitting(true)
        setErrorMessage(null)

        const returnUrl =
            typeof window !== "undefined"
                ? window.location.href
                : "http://localhost"

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
            confirmParams: {
                return_url: returnUrl,
            },
        })

        setIsSubmitting(false)

        if (error) {
            const message = error.message || "Unable to complete payment."
            setErrorMessage(message)
            sileo.error({ title: message })
            return
        }

        if (paymentIntent?.status === "succeeded") {
            sileo.success({ title: "Payment completed successfully" })
            onSuccess()
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <PaymentElement />
            </div>

            {errorMessage ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="flex items-center justify-end gap-3">
                {isSubmitting ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Spinner className="h-4 w-4" />
                        Processing payment...
                    </div>
                ) : null}

                <Button
                    type="submit"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={!stripe || !elements || isSubmitting}
                >
                    {isSubmitting ? "Confirming..." : "Pay now"}
                </Button>
            </div>
        </form>
    )
}
