"use server";

import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { cookies } from "next/headers";
import { actionFailure, actionSuccess, getApiErrorMessage, type ActionResult } from "@/lib/action-result";

const checkoutRequest = async (
  accessToken: string,
  notes: string | null,
  shipping_address_line1: string,
  shipping_address_line2: string | null,
  shipping_city: string,
  shipping_country: string,
  shipping_postal_code: string,
) => {
  const response = await api.POST("/api/v1/orders/testing-route", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      notes,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_country,
      shipping_postal_code,
    },
  });

  return response;
};

export const checkout = async (
  notes: string | null,
  shipping_address_line1: string,
  shipping_address_line2: string | null,
  shipping_city: string,
  shipping_country: string,
  shipping_postal_code: string,
): Promise<ActionResult<components["schemas"]["OrderResponse"]>> => {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in before checking out.");

  try {
    const response = await checkoutRequest(
      accessToken,
      notes,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_country,
      shipping_postal_code,
    );

    if (response.error) {
      return actionFailure(
        getApiErrorMessage(
          response.error,
          "Checkout failed. Please try again.",
          response.response.status,
        ),
      );
    }

    if (!response.data || typeof response.data !== "object") {
      return actionFailure("Checkout failed. Please try again.");
    }

    return actionSuccess(response.data as components["schemas"]["OrderResponse"]);
  } catch {
    return actionFailure("Checkout failed. Please try again.");
  }
};
