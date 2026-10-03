import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    return NextResponse.json({
      orders: response.data?.items ?? [],
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to load order history",
      },
      { status: 500 },
    );
  }
}
