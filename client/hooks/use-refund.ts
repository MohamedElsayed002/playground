"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import {
  getRefundStatusAction,
  requestRefundAction,
} from "@/actions/refund.action";
import { unwrapActionResult } from "@/lib/action-result";

type RefundRequestVariables = {
  orderId: number;
  idempotencyKey: string;
};

export function useRefundRequest() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["refund-request"],
    mutationFn: async ({ orderId, idempotencyKey }: RefundRequestVariables) => {
      const response = unwrapActionResult(
        await requestRefundAction(orderId, idempotencyKey),
      );
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      sileo.success({
        title: "Refund request submitted",
        description: response.message,
      });
    },
    onError: (error) => {
      sileo.error({
        title: error.message || "Unable to submit the refund request",
      });
    },
  });

  return mutation;
}

export function useRefundStatus(orderId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["refund-status", orderId],
    queryFn: async () =>
      unwrapActionResult(await getRefundStatusAction(orderId)),
    enabled,
    retry: 4,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return ["refunded", "failed", "expired"].includes(status ?? "")
        ? false
        : 2000;
    },
    refetchIntervalInBackground: true,
  });
}
