import { getUserCart } from "@/actions/cart.action";
import { components } from "@/lib/api/schema";
import { useQuery } from "@tanstack/react-query";
import { unwrapActionResult } from "@/lib/action-result";

export type CartItem = components["schemas"]["CartResponse"];

export const useGetUserCart = () => {
  const { data, isLoading, isError, error } = useQuery<CartItem>({
    queryKey: ["user-cart"],
    queryFn: async () => unwrapActionResult(await getUserCart()),
  });

  return {
    data,
    isLoading,
    isError,
    error,
  };
};
