"use server"

import { api } from "@/lib/api/client"

export async function addCartItemAction(productId: number, quantity: number) {
    const result = await api.POST("/api/v1/orders/cart/items", {
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