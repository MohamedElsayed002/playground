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

type RefundRequestResponse = components["schemas"]["RefundResponse"];
type RefundStatusResponse = components["schemas"]["RefundStatusResponse"];

export async function requestRefundAction(
  orderId: number,
  idempotencyKey: string,
): Promise<ActionResult<RefundRequestResponse>> {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to request a refund.");

  try {
    const result = await api.POST("/api/v1/orders/{order_id}/refund", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "idempotency-key": idempotencyKey,
      },
      params: { path: { order_id: orderId } },
    });

    if (result.error) {
      return actionFailure(
        getApiErrorMessage(
          result.error,
          "Unable to submit the refund request. Please try again.",
          result.response.status,
        ),
      );
    }
    if (!result.data) {
      return actionFailure("The refund service returned an empty response.");
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Could not submit the refund request. Please try again.");
  }
}

export async function getRefundStatusAction(
  orderId: number,
): Promise<ActionResult<RefundStatusResponse>> {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to check refund status.");

  try {
    const result = await api.GET("/api/v1/orders/{order_id}/refund-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { path: { order_id: orderId } },
    });

    if (result.error) {
      return actionFailure(
        getApiErrorMessage(
          result.error,
          "Unable to check the refund status right now.",
          result.response.status,
        ),
      );
    }
    if (!result.data) {
      return actionFailure("The refund status service returned an empty response.");
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Could not check the refund status. Please try again.");
  }
}
