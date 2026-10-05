"use client"

import { checkCheckoutStatus, checkout } from "@/actions/checkout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrapActionResult } from "@/lib/action-result";
import { useState } from "react";

type CheckoutVariables = {
  notes: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_country: string;
  shipping_postal_code: string;
};

export const useCheckout = () => {
  const queryClient = useQueryClient();
  const [orderId,setOrderId] = useState<number | null>(null)

  const {
    mutate: checkoutMutate,
    error,
    isPending,
  } = useMutation({
    mutationKey: ["checkout"],
    mutationFn: async ({
      notes,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_country,
      shipping_postal_code,
    }: CheckoutVariables) => {
      return unwrapActionResult(await checkout(
        notes,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_country,
        shipping_postal_code,
      ));
    },
    onSuccess: (data) => {
      setOrderId(data.id)
      queryClient.invalidateQueries({
        queryKey: ["user-orders"],
      });
    },
  });

  const paymentQuery = useQuery({
    queryKey: ["checkout-payment-status",orderId],
    queryFn: async () => {
      if(!orderId) return
      const response = await checkCheckoutStatus(`${orderId}`)
      return response
    },
    enabled: orderId !== null,
    refetchInterval: (query) => {
      const order_keys = query.state.data

      return order_keys?.stripe_client_secret ? false : 5000
    },
    refetchIntervalInBackground: true,
    retry: true
  })

  return {
    checkoutMutate,
    isPending,
    error,
    payment: paymentQuery.data,
    paymentLoading: paymentQuery.isLoading
  };
};
