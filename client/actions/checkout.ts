import { api } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";

export const checkout = async (notes: string | null,shipping_address_line1: string | null,shipping_address_line2: string | null,shipping_city: string | null,shipping_country: string | null,shipping_postal_code: string | null) => {

    const response = await api.POST("/api/v1/orders/testing-route",{
        body: {
            notes,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_country,
            shipping_postal_code
        }
    })

    if(response.error) {
        throw new Error(response.error.detail || "Checkout failed")
    }

    return response.data
}