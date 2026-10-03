"use server";

import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import {
  actionFailure,
  actionSuccess,
  getApiErrorMessage,
  type ActionResult,
} from "@/lib/action-result";
import type { components } from "@/lib/api/schema";

export async function addCartItemAction(
  productId: number,
  quantity: number,
): Promise<ActionResult<components["schemas"]["CartActionResponse"]>> {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to add items to your cart.");

  try {
    const result = await api.POST("/api/v1/orders/cart/items", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        product_id: productId,
        quantity,
      },
    });

    if (result.error) {
      return actionFailure(
        getApiErrorMessage(
          result.error,
          "Failed to add product to cart. Please try again.",
          result.response.status,
        ),
      );
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Could not add product to cart. Please try again.");
  }
}

export async function getUserCart(): Promise<
  ActionResult<components["schemas"]["CartResponse"]>
> {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to view your cart.");

  try {
    const result = await api.GET("/api/v1/orders/cart", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (result.error) {
      return actionFailure(
        // @ts-expect-error accept unknown type for result.error`
        getApiErrorMessage(result.error, "Failed to load your cart.", result.response.status),
      );
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Could not load your cart. Please try again.");
  }
}

export async function removeItem(productId: number): Promise<ActionResult<string>> {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to update your cart.");

  try {
    const result = await api.DELETE("/api/v1/orders/cart/items/{product_id}", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        path: {
          product_id: productId,
        },
      },
    });

    if (result.error) {
      return actionFailure(
        getApiErrorMessage(result.error, "Failed to remove item from cart.", result.response.status),
      );
    }

    return actionSuccess(result.data.message);
  } catch {
    return actionFailure("Could not update your cart. Please try again.");
  }
}
