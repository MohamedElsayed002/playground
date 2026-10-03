"use server";

import { api } from "@/lib/api/client";
import { cookies } from "next/headers";

export async function redeemFlashSale(flashSaleId: number) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

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
    const error = result.error as { message?: string };
    throw new Error(error.message || "Unable to start flash-sale checkout");
  }

  return result.data;
}

export async function getFlashSalePaymentStatus(payment_id: string) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

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
    const error = result.error as { message?: string };
    throw new Error(error.message || "Unable to check flash-sale payment status");
  }

  return result.data;
}

export async function checkWhetherUserRedeemed(flashSaleId: number) {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

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
    const error = result.error as { message?: string };
    throw new Error(error.message || "Unable to start flash-sale checkout");
  }

  return result.data;
}
