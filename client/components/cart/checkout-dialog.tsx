"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ShoppingBag } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { useCheckout } from "@/hooks/use-checkout"
import { sileo } from "sileo"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    notes: z.string(),
    shipping_address_line1: z.string().min(1, "Shipping address line 1 is required"),
    shipping_address_line2: z.string(),
    shipping_city: z.string().min(1, "City is required"),
    shipping_country: z.string().min(1, "Country is required"),
    shipping_postal_code: z.string().min(1, "Postal code is required"),
})

export const CheckoutDialog = () => {
    const [open, setOpen] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

    const { checkoutMutate, isPending, error } = useCheckout()

    const router = useRouter()

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            notes: "",
            shipping_address_line1: "",
            shipping_address_line2: "",
            shipping_city: "",
            shipping_country: "",
            shipping_postal_code: "",
        },
    })

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        checkoutMutate(
            {
                notes: data.notes ?? null,
                shipping_address_line1: data.shipping_address_line1,
                shipping_address_line2: data.shipping_address_line2 ?? null,
                shipping_city: data.shipping_city,
                shipping_country: data.shipping_country,
                shipping_postal_code: data.shipping_postal_code,
            },
            {
                onSuccess: () => {
                    setShowConfetti(true)
                    sileo.success({ title: "Checkout Successfully" })
                    window.setTimeout(() => {
                        setShowConfetti(false)
                        setOpen(false)
                        form.reset()
                        router.push("/small-ecommerce")
                    }, 4000)
                },
                onError: (error) => {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed Checkout"
                    sileo.error({ title: message })
                },
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button className="bg-yellow-500" type="button" onClick={() => setOpen(true)}>
                <ShoppingBag className="size-4" />
                Checkout
            </Button>

            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Reserve your Cart</DialogTitle>
                    <DialogDescription>Cart Description</DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="shipping_address_line1">Shipping Address Line 1</FieldLabel>
                            <Input
                                id="shipping_address_line1"
                                placeholder="123 Main St"
                                {...form.register("shipping_address_line1")}
                            />
                            <FieldError>
                                {form.formState.errors.shipping_address_line1?.message}
                            </FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="shipping_address_line2">Shipping Address Line 2</FieldLabel>
                            <FieldDescription>Optional apartment, suite, or unit number.</FieldDescription>
                            <Input
                                id="shipping_address_line2"
                                placeholder="Apt 4B"
                                {...form.register("shipping_address_line2")}
                            />
                            <FieldError>
                                {form.formState.errors.shipping_address_line2?.message}
                            </FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="shipping_city">City</FieldLabel>
                            <Input id="shipping_city" placeholder="City" {...form.register("shipping_city")} />
                            <FieldError>{form.formState.errors.shipping_city?.message}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="shipping_country">Country</FieldLabel>
                            <Input
                                id="shipping_country"
                                placeholder="Country"
                                {...form.register("shipping_country")}
                            />
                            <FieldError>{form.formState.errors.shipping_country?.message}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="shipping_postal_code">Postal Code</FieldLabel>
                            <Input
                                id="shipping_postal_code"
                                placeholder="Postal Code"
                                {...form.register("shipping_postal_code")}
                            />
                            <FieldError>{form.formState.errors.shipping_postal_code?.message}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="notes">Notes</FieldLabel>
                            <FieldDescription>Optional order notes or special instructions.</FieldDescription>
                            <Input id="notes" placeholder="Add any notes here" {...form.register("notes")} />
                            <FieldError>{form.formState.errors.notes?.message}</FieldError>
                        </Field>
                    </FieldGroup>

                    {error ? (
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {error instanceof Error ? error.message : "An error occurred during checkout."}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Submitting..." : "Checkout"}
                        </Button>
                    </DialogFooter>
                </form>

                {showConfetti && windowSize.width > 0 && (
                    <Confetti width={windowSize.width} height={windowSize.height} />
                )}
            </DialogContent>
        </Dialog>
    )
}
