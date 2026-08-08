"use client"

import { addCartItemAction } from "@/actions/cart.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type AddCartItemVariables = {
    productId: number;
    quantity: number;
};

export const useAddProductCard = () => {

    const queryClient = useQueryClient()

    const { mutate, error, isPending } = useMutation({
        mutationKey: ["add-cart-item"],
        mutationFn: ({ productId, quantity }: AddCartItemVariables) =>
            addCartItemAction(productId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-cart"] })
        }
    })

    return {
        mutate,
        error,
        isPending
    }
}
