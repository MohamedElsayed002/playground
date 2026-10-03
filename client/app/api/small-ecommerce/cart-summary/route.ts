import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/action-result";

export async function GET() {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const response = await api.GET("/api/v1/orders/cart", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.error) {
      return NextResponse.json(
        {
          error: getApiErrorMessage(
            // @ts-expect-error accept unknown type for response.error
            response.error,
            "Unable to load your cart",
            // @ts-expect-error accept unknown type for response.response.status
            response.response.status,
          ),
        },
        { status: getApiErrorStatus(response) },
      );
    }

    if (!response.data) {
      return NextResponse.json({ error: "Unable to load your cart" }, { status: 502 });
    }

    return NextResponse.json({ cart: response.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to load your cart. Please try again." },
      { status: 500 },
    );
  }
}
