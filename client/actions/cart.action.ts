"use server"

import { api } from "@/lib/api/client"
import { cookies } from "next/headers"

export async function addCartItemAction(productId: number, quantity: number) {

    const accessToken = (await cookies()).get("fastapi_access")?.value

    const result = await api.POST("/api/v1/orders/cart/items", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        },
        body: {
            product_id: productId,
            quantity,
        },
    })

    if (result.error) {
        // @ts-expect-error
        throw new Error(result.error.detail || "Failed to add product to cart")
    }

    return result.data
}


export async function getUserCart() {

    const accessToken = (await cookies()).get("fastapi_access")?.value


    const result = await api.GET("/api/v1/orders/cart", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })

    if (result.error) {
        throw new Error("Failed to fetch user cart")
    }

    return result.data
}