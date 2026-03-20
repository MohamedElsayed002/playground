import { useEffect, useRef } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/store/chat.store";
import { messageKeys, useInjectMessage } from "./use-messages";
import { roomKeys } from "./use-rooms";
import type {
    Message,
    MessageRead,
    TypingPayload,
    UserPresencePayload,
    MessageDeletedPayload
} from "@/types"

export function useSocket(roomId: string) {
    const profile = useAuthStore((s) => s.profile)
    const setTyping = useChatStore((s) => s.setTyping)
    const setOnline = useChatStore((s) => s.setOnline)
    const clearRoom = useChatStore((s) => s.clearRoom)
    const queryClient = useQueryClient()
    const injectMessage = useInjectMessage(roomId)
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if(!profile) return 

        const socket = getSocket(profile.id)

        socket.emit('join_room', {room_id: roomId})

        socket.on('new_message', (message: Message) => {
            injectMessage(message)

            queryClient.invalidateQueries({queryKey: roomKeys.all(profile.id)})
        })


        socket.on('message_updated',(updated: Message) => {
            queryClient.setQueryData<InfiniteData<Message[]>>(
                messageKeys.list(roomId),
                (old) => {
                    if(!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) =>
                        page.map((m) => (m.id === updated.id ? updated : m)))
                    }
                }
            )
        })

        socket.on('message_deleted', (payload: MessageDeletedPayload) => {
            queryClient.setQueryData<InfiniteData<Message[]>>(
                messageKeys.list(roomId),
                (old) => {
                    if(!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) => 
                            page.map((m) =>
                            m.id === payload.message_id
                    ? {...m, is_deleted: true,content: ''} : m))
                    }
                }
            )
        })

        socket.on('user_typing',(payload: TypingPayload) => {
            setTyping(roomId,payload.user_id,payload.is_typing)
        })

        socket.on('user_joined',(payload: UserPresencePayload) => {
            setOnline(roomId,payload.user_id,true)
        })

        socket.on('user_left',(payload: UserPresencePayload) => {
            setOnline(roomId,payload.user_id,false)
        })


        socket.on('message_read',(_receipt: MessageRead) => {

        })

        return () => {
            socket.emit("leave_room",{room_id: roomId})
            socket.off("new_message")
            socket.off("message_updated")
            socket.off("message_deleted")
            socket.off("user_typing")
            socket.off("user_joined")
            socket.off("user_left")
            socket.off("message_read")
            clearRoom(roomId)
        }
    },[roomId,profile?.id])


    const emitTyping = (isTyping: boolean) => {
        if(!profile) return
        const socket = getSocket(profile.id)
        const event = isTyping ? 'typing_start': 'typing_stop'
        socket.emit(event,{
            room_id: roomId,
            user_id: profile.id,
            username: profile.userId
        })
    }

    // Auto stop typing after 3 seconds of inactivity
    const handleKeyPress = () => {
        emitTyping(true)
        if(typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => emitTyping(false),3000)
    }

    const stopTyping = () => {
        if(typingTimer.current) clearTimeout(typingTimer.current)
        emitTyping(false)
    }

    return {
        handleKeyPress,
        stopTyping
    }
}