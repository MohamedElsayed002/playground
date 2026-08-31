import { api } from "@/lib/api/client";

export const checkout = async (notes: string | null,shipping_address_line1: string,shipping_address_line2: string | null,shipping_city: string,shipping_country: string,shipping_postal_code: string) => {

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
        // @ts-expect-error
        throw new Error(response.error.detail || "Checkout failed")
    }

    return response.data
}