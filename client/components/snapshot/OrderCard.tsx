import { Order } from "@/app/small-ecommerce/snapshot/page";

export default function OrderCard({ order }: { order: Order }) {
    return (
        <article className="bg-white shadow rounded-lg p-6 w-full">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold">{order.order_number}</h3>
                    <p className="text-sm text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleString() : ""}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-white ${order.payment_status === 'paid' ? 'bg-green-600' : 'bg-yellow-500'}`}>{order.payment_status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">Status: {order.status}</div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <h4 className="font-medium">Items</h4>
                    <ul className="mt-2 divide-y">
                        {order.items.map((it) => (
                            <li key={it.id} className="py-2 flex justify-between">
                                <div>
                                    <div className="font-medium">{it.product_name}</div>
                                    <div className="text-sm text-gray-500">Qty: {it.quantity}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">{it.total_price}</div>
                                    <div className="text-sm text-gray-500">unit {it.unit_price}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-l pl-4">
                    <h4 className="font-medium">Summary</h4>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                        <div className="flex justify-between"><span>Subtotal</span><span>{order.subtotal}</span></div>
                        <div className="flex justify-between"><span>Shipping</span><span>{order.shipping_cost}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>{order.tax}</span></div>
                        <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{order.total}</span></div>
                    </div>

                    <div className="mt-4">
                        <h5 className="font-medium">Shipping</h5>
                        <div className="text-sm text-gray-600">
                            <div>{order.shipping_address_line1}</div>
                            {order.shipping_address_line2 && <div>{order.shipping_address_line2}</div>}
                            <div>{order.shipping_city} {order.shipping_country}</div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}
