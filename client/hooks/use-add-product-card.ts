"use client"

import { addCartItemAction } from "@/actions/cart.action";
import { checkWhetherUserRedeemed, getFlashSalePaymentStatus, redeemFlashSale } from "@/actions/flash-sale.action";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sileo } from "sileo";
import { useAuthStoreFastAPI } from "@/store/auth-fastapi.store";

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
            sileo.success({
                title: "Added to cart"
            })
        },
        onError: (error) => {
            sileo.error({ title: error.message || "Unable to add product to cart" })
        }
    })

    return {
        mutate,
        error,
        isPending
    }
}


export const useClaimDiscount = () => {
    const [purchaseId, setPurchaseId] = useState<number | null>(null)

    const { mutate, isPending } = useMutation({
        mutationFn: ({ flashSaleId }: { flashSaleId: number }) => redeemFlashSale(flashSaleId),
        onSuccess: (data) => {
            setPurchaseId(data.id)
            sileo.success({
                title: "Flash sale checkout started",
                description: "Your discounted purchase is being prepared for payment.",
            })
        },
        onError: (error) => {
            sileo.error({ title: error.message || "Unable to claim flash sale" })
        },
    })

    const paymentQuery = useQuery({
        queryKey: ["flash-sale-payment-status", purchaseId],
        queryFn: () => getFlashSalePaymentStatus(String(purchaseId)),
        enabled: purchaseId !== null,
        refetchInterval: (query) => {
            const payment = query.state.data

            return payment?.payment_id && payment.stripe_client_secret ? false : 1000
        },
        refetchIntervalInBackground: true,
        retry: true,
    })

    return {
        mutate,
        isPending,
        payment: paymentQuery.data,
        isPaymentPending: paymentQuery.isFetching,
        isPaymentReady: Boolean(
            paymentQuery.data?.payment_id && paymentQuery.data.stripe_client_secret,
        ),
        paymentError: paymentQuery.error,
    }
}

export const useCheckUser = (flashSaleId: number | null) => {
    const { isLoggedIn } = useAuthStoreFastAPI()

    const { data, isPending, error } = useQuery({
        queryKey: ["user-redeemed", flashSaleId],
        queryFn: async () => checkWhetherUserRedeemed(flashSaleId!),
        enabled: isLoggedIn && flashSaleId !== null,
    })
    console.log("DATA", data)
    return {
        data,
        isPending,
        error,
        isLoggedIn,
    }
}