import { api } from "@/lib/api/client"
import type { Metadata } from "next"
import { CartView } from "../../../components/cart/cart-view"
import type { CartData } from "./components/types"

export const metadata: Metadata = {
    title: "Cart",
}

export default async function Page() {
    const data = await api.GET("/api/v1/orders/cart")
    const cart = (data.data ?? null) as CartData | null

    return <CartView cart={cart} />
}