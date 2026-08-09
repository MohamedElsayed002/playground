import { getUserCart } from "@/actions/cart.action";
import { components } from "@/lib/api/schema";
import { useQuery } from "@tanstack/react-query";


export type CartItem = components["schemas"]["CartResponse"]

export const useGetUserCart = () => {
    
    const { data, isLoading, isError} = useQuery<CartItem>({
        queryKey: ["user-cart"],
        queryFn: getUserCart
    })

    return {
        data,
        isLoading,
        isError
    }
}