"use client"

import { addCartItemAction, removeItem } from "@/actions/cart.action";
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

            return payment?.payment_id && payment.stripe_client_secret ? false : 5000
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

export const useCheckUser = (flashSaleId: number | number[] | null) => {
    const { isLoggedIn } = useAuthStoreFastAPI()
    const flashSaleIds = flashSaleId === null
        ? []
        : Array.isArray(flashSaleId)
            ? [...new Set(flashSaleId)]
            : [flashSaleId]

    const { data, isPending, error } = useQuery({
        queryKey: ["user-redeemed", flashSaleIds],
        queryFn: async () => {
            if (Array.isArray(flashSaleId)) {
                return Promise.all(flashSaleIds.map((id) => checkWhetherUserRedeemed(id)))
            }

            return checkWhetherUserRedeemed(flashSaleIds[0])
        },
        enabled: isLoggedIn && flashSaleIds.length > 0,
    })

    const redeemedSaleIds = Array.isArray(flashSaleId)
        ? new Set(
            flashSaleIds.filter((id, index) => Array.isArray(data) && data[index]),
        )
        : new Set(data === true ? [flashSaleIds[0]] : [])

    return {
        data,
        redeemedSaleIds,
        isPending,
        error,
        isLoggedIn,
    }
}

export const useRemoveItemCart = () => {

    const queryClient = useQueryClient()

    const { mutate, isError, isPending } = useMutation({
        mutationKey: ["remove-product"],
        mutationFn: ({productId}: {productId: number}) => removeItem(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-cart"] })
            sileo.success({
                title: "Product removed successfully"
            })
        }
    })

    return {
        mutate, 
        isError, 
        isPending
    }
}