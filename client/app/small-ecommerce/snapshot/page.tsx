import { api } from "@/lib/api/client";
import { Metadata } from "next";
import OrderList from "@/components/snapshot/OrderList";
import type { components } from "@/lib/api/schema";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiErrorMessage } from "@/lib/action-result";
export const metadata: Metadata = {
  title: "SnapShot",
};

export type Order = components["schemas"]["PaginatedResponse_OrderResponse_"]["items"][number];

export default async function Page() {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) redirect("/auth/login-fastapi");
  let orders: Order[] = [];
  let loadError: string | null = null;

  try {
    const response = await api.GET("/api/v1/orders/my", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        query: {
          page_size: 10,
          page: 1,
        },
      },
    });

    if (response.error) {
      loadError = getApiErrorMessage(
        response.error,
        "Unable to load your order history right now.",
        response.response.status,
      );
    } else {
      orders = response.data?.items ?? [];
    }
  } catch {
    loadError = "Unable to load your order history right now. Please try again.";
  }
  const total = orders.reduce((acc, order) => acc + parseFloat(order.total), 0);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600">Snapshot — Previous Orders</h1>
          <h2>
            Total Revenue: <span className="font-bold">${total?.toFixed(2) ?? "0.00"}</span>
          </h2>
        </header>

        <main className="mt-6">
          {loadError ? (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
              {loadError}
            </p>
          ) : (
            <OrderList orders={orders} />
          )}
        </main>
      </div>
    </div>
  );
}
