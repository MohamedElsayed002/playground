import { api } from "@/lib/api/client"
import { Metadata } from "next"
import OrderList from "@/components/snapshot/OrderList"
import type { components } from "@/lib/api/schema"
import { cookies } from "next/headers"
export const metadata: Metadata = {
    title: "SnapShot",
}

export type Order = components["schemas"]["PaginatedResponse_OrderResponse_"]["items"][number]

export default async function Page() {

    const accessToken = (await cookies()).get("fastapi_access")?.value

    const data = await api.GET("/api/v1/orders/my", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        },
        params: {
            query: {
                page_size: 10,
                page: 1,
            },
        },
    })

    const orders = data.data?.items || []
    const total = data?.data?.items.reduce((acc: number, order: Order) => acc + parseFloat(order.total), 0)

    return (    
        <div className="min-h-screen py-8">
            <div className="max-w-5xl mx-auto px-4">
                <header className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-blue-600">Snapshot — Previous Orders</h1>
                    <h2>Total Revenue: <span className="font-bold">${total?.toFixed(2) ?? "0.00"}</span></h2>
                </header>

                <main className="mt-6">
                    <OrderList orders={orders} />
                </main>
            </div>
        </div>
    )
}