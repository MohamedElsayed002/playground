import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/action-result";

export async function POST(req: Request) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { productId } = (await req.json()) as { productId?: string | number };
    const parsedProductId = Number(productId);

    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      return NextResponse.json({ error: "A valid productId is required" }, { status: 400 });
    }

    const response = await api.POST("/api/v1/orders/cart/items", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        product_id: parsedProductId,
        quantity: 1,
      },
    });

    if (response.error) {
      return NextResponse.json(
        {
          error: getApiErrorMessage(
            response.error,
            "Failed to add product to cart",
            response.response.status,
          ),
        },
        { status: getApiErrorStatus(response) },
      );
    }

    if (!response.data) {
      return NextResponse.json({ error: "Failed to add product to cart" }, { status: 502 });
    }

    return NextResponse.json({
      message: response.data.message ?? "Product successfully added to cart",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not add product to cart. Please try again." },
      { status: 500 },
    );
  }
}

// Remove Item From Cart
// DELETE api/small-ecommerce/add-to-cart

export async function DELETE(req: Request) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { productId } = await req.json();

    if (!productId || !Number.isInteger(Number(productId)) || Number(productId) <= 0) {
      return NextResponse.json({ error: "A valid productId is required" }, { status: 400 });
    }

    const response = await api.DELETE("/api/v1/orders/cart/items/{product_id}", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        path: {
          product_id: Number(productId),
        },
      },
    });

    if (response.error) {
      return NextResponse.json(
        {
          error: getApiErrorMessage(
            response.error,
            "Failed to remove product from cart",
            response.response.status,
          ),
        },
        { status: getApiErrorStatus(response) },
      );
    }

    if (!response.data) {
      return NextResponse.json({ error: "Failed to remove product from cart" }, { status: 502 });
    }

    return NextResponse.json({ message: response.data.message });
  } catch {
    return NextResponse.json({ error: "Unable to remove product from cart" }, { status: 500 });
  }
}
