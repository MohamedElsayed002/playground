

import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

        if (!response.data) {
            return NextResponse.json({ error: "Unable to load your cart" }, { status: 502 });
        }

        return NextResponse.json({ cart: response.data });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load your cart" },
            { status: 500 },
        );
    }
}