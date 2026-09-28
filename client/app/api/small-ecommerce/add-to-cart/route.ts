import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

        if (!response.data) {
            return NextResponse.json({ error: "Failed to add product to cart" }, { status: 502 });
        }

        return NextResponse.json({
            message: response.data.message ?? "Product successfully added to cart",
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add product to cart" },
            { status: 500 },
        );
    }
}