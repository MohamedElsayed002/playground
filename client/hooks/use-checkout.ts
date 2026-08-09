import { checkout } from "@/actions/checkout";
import { useMutation, useQueryClient } from "@tanstack/react-query";


type CheckoutVariables = {
    notes: string | null,
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_country: '',
    shipping_postal_code: ''
}

export const useCheckout = () => {

    const queryClient = useQueryClient()

    const { mutate: checkoutMutate, error, isPending } = useMutation({
        mutationKey: ["checkout"],
        mutationFn: ({notes, shipping_address_line1,shipping_address_line2,shipping_city, shipping_country, shipping_postal_code}: CheckoutVariables)  =>
             checkout(notes,shipping_address_line1,shipping_address_line2,shipping_city,shipping_country,shipping_postal_code),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["user-orders"]
            })
        }
    })

    return {
        checkoutMutate,
        isPending,
        error
    }
}