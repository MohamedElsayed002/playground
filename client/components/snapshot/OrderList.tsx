import React from "react"
import OrderCard from "@/components/snapshot/OrderCard"
import { Order } from "@/app/small-ecommerce/snapshot/page"


export default function OrderList({ orders }: { orders: Order[] }) {
    if (!orders || orders.length === 0) {
        return <div className="text-center py-8 text-gray-500">No orders found.</div>
    }

    return (
        <div className="space-y-4 w-full">
            {orders.map((o: Order) => (
                <OrderCard key={o.id} order={o} />
            ))}
        </div>
    )
}
