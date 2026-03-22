import { GET_ALL_USERS } from "@/lib/gql";
import { gqlClient } from "@/lib/graphql-client";
import { GQL_Response_User } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const useUsers = () => {
    return useQuery<GQL_Response_User>({
        queryKey: ['all-users'],
        queryFn: () => gqlClient.request(GET_ALL_USERS)
    })
}
