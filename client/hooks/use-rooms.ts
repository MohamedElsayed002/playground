import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query"
import { gqlClient } from "@/lib/graphql-client"
import { useAuthStore } from "@/store/auth.store"
import {
    GET_ROOMS_FOR_USER,
    GET_ROOM,
    GET_ROOM_MEMBERS,
    CREATE_ROOM
} from "@/lib/gql"
import type {
    Room,
    RoomMember
} from "@/types"

// Query keys - centralised so invalidations are consistent 

export const roomKeys = {
    all: (userId: string) => ['rooms',userId] as const,
    detail: (roomId: string) => ['room',roomId] as const,
    members: (roomId: string) => ['room-members',roomId] as const
}


export function useRooms() {
    const profileId = useAuthStore((s) => s.profile?.id)

    return useQuery({
        queryKey: roomKeys.all(profileId ?? ''),
        queryFn: () => 
            gqlClient
                .request<{roomsForUser: Room[]}>(GET_ROOMS_FOR_USER, {user_id: profileId})
                .then((d) => d.roomsForUser),
        staleTime: 30_000,
        enabled: !!profileId
    })
}


export function useRoom(roomId: string) {
    return useQuery({
        queryKey: roomKeys.detail(roomId),
        queryFn: () => 
            gqlClient
                .request<{room: Room}>(GET_ROOM,{id: roomId})
                .then((d) => d.room),
        staleTime: 60_000,
        enabled: !!roomId
    })
}


export function useRoomMembers(roomId: string) {
    return useQuery({
        queryKey: roomKeys.members(roomId),
        queryFn: () => 
            gqlClient
                .request<{roomMembers: RoomMember[]}>(GET_ROOM_MEMBERS, {room_id: roomId})
                .then((d) => d.roomMembers),
        staleTime: 30_000,
        enabled: !!roomId
    })
}


export function useCreateRoom() {
    const queryClient = useQueryClient()
    const profileId = useAuthStore((s) => s.profile?.id)

    return useMutation({
        mutationFn: (data: {
            name?: string;
            description?: string;
            is_group: boolean;
            member_ids: string[]
        }) =>
            gqlClient
                .request<{createRoom: Room}>(CREATE_ROOM,{
                    input: {...data,created_by: profileId}
                })
                .then((d) => d.createRoom),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: roomKeys.all(profileId ?? '')})
        }
    })
}