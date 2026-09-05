import type { Metadata } from "next"
import { CartView } from "../../../components/cart/cart-view"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
export const metadata: Metadata = {
    title: "Cart",
}

export default async function Page() {
    const accessToken = (await cookies()).get("fastapi_access")?.value
    if(!accessToken) redirect("/auth/login-fastapi")
    return <CartView />
}