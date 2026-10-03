"use server";

import { api } from "@/lib/api/client";
import { cookies } from "next/headers";
import { actionFailure, actionSuccess, getApiErrorMessage } from "@/lib/action-result";

export async function redeemFlashSale(flashSaleId: number) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to claim this offer.");

  try {
    const result = await api.POST("/api/v1/flash-sale/{flash_sale_id}/purchase", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "idempotency-key": crypto.randomUUID(),
      },
      params: {
        path: {
          flash_sale_id: flashSaleId,
        },
      },
    });
    if (result.error) {
      return actionFailure(
        getApiErrorMessage(
          result.error,
          "Unable to start flash-sale checkout.",
          result.response.status,
        ),
      );
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Unable to start flash-sale checkout. Please try again.");
  }
}

export async function getFlashSalePaymentStatus(payment_id: string) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to check your payment.");

  try {
    const result = await api.GET("/api/v1/flash-sale/{payment_id}/check-status", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        path: {
          payment_id: Number(payment_id),
        },
      },
    });

    if (result.error) {
      return actionFailure(
        getApiErrorMessage(result.error, "Unable to check payment status.", result.response.status),
      );
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Unable to check payment status. Please try again.");
  }
}

export async function checkWhetherUserRedeemed(flashSaleId: number) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  if (!accessToken) return actionFailure("Please log in to check this offer.");

  try {
    const result = await api.GET("/api/v1/flash-sale/{flash_sale_id}/check-redeemed", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        path: {
          flash_sale_id: flashSaleId,
        },
      },
    });

    if (result.error) {
      return actionFailure(
        getApiErrorMessage(result.error, "Unable to check this offer.", result.response.status),
      );
    }

    return actionSuccess(result.data);
  } catch {
    return actionFailure("Unable to check this offer. Please try again.");
  }
}
