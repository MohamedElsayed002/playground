import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/action-result";

export async function GET() {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

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
      return NextResponse.json(
        {
          error: getApiErrorMessage(
            response.error,
            "Unable to load order history",
            response.response.status,
          ),
        },
        { status: getApiErrorStatus(response) },
      );
    }

    return NextResponse.json({
      orders: response.data?.items ?? [],
    });
  } catch {
    return Response.json(
      {
        error: "Unable to load order history right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
