"use server"

import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { cookies } from "next/headers"

type CheckoutResult =
    | { success: true; data: components["schemas"]["OrderResponse"] }
    | { success: false; error: string }

const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") return error

    if (error && typeof error === "object") {
        const detail = "detail" in error ? error.detail : undefined
        if (typeof detail === "string") return detail
        if (Array.isArray(detail)) {
            const messages = detail
                .map((item) => {
                    if (item && typeof item === "object" && "msg" in item) {
                        return typeof item.msg === "string" ? item.msg : null
                    }
                    return null
                })
                .filter((message): message is string => message !== null)
            if (messages.length > 0) return messages.join(", ")
        }
        if ("message" in error && typeof error.message === "string") {
            return error.message
        }
    }

    return "Checkout failed. Please try again."
}

const checkoutRequest = async (
    notes: string | null,
    shipping_address_line1: string,
    shipping_address_line2: string | null,
    shipping_city: string,
    shipping_country: string,
    shipping_postal_code: string,
) => {
    const accessToken = (await cookies()).get("fastapi_access")?.value

    const response = await api.POST("/api/v1/orders/testing-route", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        },
        body: {
            notes,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_country,
            shipping_postal_code
        }
    })

    return response
}

export const checkout = async (
    notes: string | null,
    shipping_address_line1: string,
    shipping_address_line2: string | null,
    shipping_city: string,
    shipping_country: string,
    shipping_postal_code: string,
): Promise<CheckoutResult> => {
    try {
        const response = await checkoutRequest(
            notes,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_country,
            shipping_postal_code,
        )

        if (response.error) {
            return { success: false, error: getErrorMessage(response.error) }
        }

        if (!response.data || typeof response.data !== "object") {
            return { success: false, error: "Checkout failed. Please try again." }
        }

        return {
            success: true,
            data: response.data as components["schemas"]["OrderResponse"],
        }
    } catch {
        return { success: false, error: "Checkout failed. Please try again." }
    }
}