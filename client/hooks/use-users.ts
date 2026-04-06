import { DELETE_USER, GET_ALL_USERS, SINGLE_USER } from "@/lib/gql";
import { gqlClient } from "@/lib/graphql-client";
import { GQL_Response_User, GQL_Single_User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useUsers = () => {
    return useQuery<GQL_Response_User>({
        queryKey: ['all-users'],
        queryFn: () => gqlClient.request(GET_ALL_USERS),
        // staleTime:
    })
}

export const useSingleUser = (id?: string) => {
    return useQuery<GQL_Single_User>({
        queryKey: ['single-user', id],
        enabled: !!id,
        queryFn: () => gqlClient.request(SINGLE_USER, { id }),
    })
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) =>
            gqlClient.request<{ RemoveUser: { status: number; message: string } }>(DELETE_USER, { id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-users'] })
        }
    })
}
