"use server"

import { api } from "@/lib/api/client";
import { cookies } from "next/headers"
export const checkout = async (notes: string | null, shipping_address_line1: string, shipping_address_line2: string | null, shipping_city: string, shipping_country: string, shipping_postal_code: string) => {


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

    if (response.error) {
        // @ts-expect-error
        throw new Error(response.error.detail || "Checkout failed")
    }

    return response.data
}