import { getUserCart } from "@/actions/cart.action";
import { useQuery } from "@tanstack/react-query";

export const useGetUserCart = () => {
    
    const { data, isLoading, isError} = useQuery({
        queryKey: ["user-cart"],
        queryFn: getUserCart
    })

    return {
        data,
        isLoading,
        isError
    }
}