import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { components } from "@/lib/api/schema";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/action-result";

type CheckoutDetails = components["schemas"]["OrderCheckoutCreate"];

export async function POST(request: Request) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const checkoutDetails = (await request.json()) as CheckoutDetails;
    const response = await api.POST("/api/v1/orders/testing-route", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: checkoutDetails,
    });

    if (response.error) {
      return NextResponse.json(
        {
          error: getApiErrorMessage(
            response.error,
            "Checkout failed. Please try again.",
            response.response.status,
          ),
        },
        { status: getApiErrorStatus(response) },
      );
    }

    if (!response.data) {
      return NextResponse.json(
        { error: "Checkout failed. Please check your cart and try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: `Order ${response.data.order_number} was placed successfully.`,
    });
  } catch {
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
