import { api } from "@/lib/api/client";
import { NextResponse } from "next/server";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/action-result";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("search")?.trim();

  if (!search) {
    return NextResponse.json({ error: "A product name is required" }, { status: 400 });
  }

  try {
    const response = await api.GET("/api/v1/products", {
      params: {
        query: {
          search,
          page: 1,
          page_size: 10,
        },
      },
    });

    if (response.error) {
      return NextResponse.json(
        {
          error: getApiErrorMessage(
            response.error,
            "Unable to search products",
            response.response.status,
          ),
        },
        { status: getApiErrorStatus(response) },
      );
    }

    if (!response.data) {
      return NextResponse.json({ error: "Unable to search products" }, { status: 502 });
    }

    return NextResponse.json({ products: response.data.items });
  } catch {
    return NextResponse.json(
      { error: "Unable to search products right now. Please try again." },
      { status: 500 },
    );
  }
}
