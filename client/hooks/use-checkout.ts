import { checkout } from "@/actions/checkout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrapActionResult } from "@/lib/action-result";

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-orders"],
      });
    },
  });

  return {
    checkoutMutate,
    isPending,
    error,
  };
};
