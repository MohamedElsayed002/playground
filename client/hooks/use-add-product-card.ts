"use client"

import { addCartItemAction } from "@/actions/cart.action";
import { useMutation } from "@tanstack/react-query";

type AddCartItemVariables = {
    productId: number;
    quantity: number;
};

export const useAddProductCard = () => {
    const { mutate, error, isPending} = useMutation({
        mutationFn: ({ productId, quantity }: AddCartItemVariables) =>
            addCartItemAction(productId, quantity),
    })

    return {
        mutate,
        error,
        isPending
    }
}
