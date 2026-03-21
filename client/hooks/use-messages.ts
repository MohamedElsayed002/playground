import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    InfiniteData
} from "@tanstack/react-query"
import { useCallback } from "react"
import { gqlClient } from "@/lib/graphql-client"
import { useAuthStore } from "@/store/auth.store"
import {
    GET_MESSAGES,
    SEND_MESSAGE,
    EDIT_MESSAGE,
    DELETE_MESSAGE,
    MARK_READ
} from "@/lib/gql"
import type { Message, MessageRead } from "@/types"

export const messageKeys = {
    list: (roomId: string) => ['messages', roomId] as const
}


export function useMessages(roomId: string) {
    return useInfiniteQuery({
        queryKey: messageKeys.list(roomId),
        initialPageParam: undefined as string | undefined,

        queryFn: ({ pageParam }) =>
            gqlClient
                .request<{ messages: Message[] }>(GET_MESSAGES, {
                    input: { room_id: roomId, before: pageParam, limit: 30 },
                })
                .then((d) => d.messages),
        getNextPageParam: (lastPage) =>
            lastPage.length === 30 ? lastPage[lastPage.length - 1].created_at : undefined,
        staleTime: 0,
        enabled: !!roomId
    })
}


export function useSendMessage(roomId: string) {
    const queryClient = useQueryClient()
    const profile = useAuthStore((s) => s.profile)

    return useMutation({
        mutationFn: (data: { content: string; type?: string; reply_to_id?: string }) =>
            gqlClient
                .request<{ sendMessage: Message }>(SEND_MESSAGE, {
                    input: {
                        room_id: roomId,
                        sender_id: profile?.id,
                        ...data
                    },
                })
                .then((d) => d.sendMessage),

        // Optimistic update
        // 1. Build a temporary "optimistic" message
        // 2. Inject it at the top of the message list immediately
        // 3. Tanstack Query will replace it with the real message on Success
        // or remove it on failure

        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: messageKeys.list(roomId) })

            const optimisticMsg: Message = {
                id: `optimistic-${Date.now()}`,
                room_id: roomId,
                sender_id: profile?.id,
                sender: {
                    id: profile?.id ?? '',
                    username: profile?.username ?? '',
                    avatar_url: profile?.avatarUrl ?? undefined,
                    is_online: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                content: data.content,
                type: (data.type ?? 'text') as Message['type'],
                is_deleted: false,
                reply_to_id: data.reply_to_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // Inject into the first page (newest messages)
            queryClient.setQueryData<InfiniteData<Message[]>>(
                messageKeys.list(roomId),
                (old) => {
                    if (!old) return old
                    const pages = [[optimisticMsg, ...old.pages[0]], ...old.pages.slice(1)]
                    return { ...old, pages }
                }
            )

            return { optimisticMsg }
        },

        onError: (err, data, context) => {
            // Roll back: remove the optimistic message
            queryClient.setQueryData<InfiniteData<Message[]>>(
                messageKeys.list(roomId),
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) =>
                            page.filter((m) => m.id !== context?.optimisticMsg.id),
                        )
                    }
                }
            )
        },

        onSuccess: (realMessage, _vars, context) => {
            // Replace the optimistic message with the real one from the server
            queryClient.setQueryData<InfiniteData<Message[]>>(
                messageKeys.list(roomId),
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) =>
                            page.map((m) =>
                                m.id === context?.optimisticMsg.id ? realMessage : m,
                            ),
                        ),
                    };
                },
            );
        },
    })
}


export function useEditMessage(roomId: string) {
    const queryClient = useQueryClient()
    const profile = useAuthStore((s) => s.profile)

    return useMutation({
        mutationFn: (data: {message_id: string; content: string}) => 
                gqlClient
                    .request<{editMessage: Message}>(EDIT_MESSAGE,{
                        input: {message_id: data.message_id, content: data.content},
                        requesting_user_id: profile?.id
                    })
                    .then((d) => d.editMessage),

        onSuccess: (updated) => {
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
        }
    })
}



export function useDeleteMessage(roomId: string) {
    const queryClient = useQueryClient();
    const profile     = useAuthStore((s) => s.profile);
   
    return useMutation({
      mutationFn: (messageId: string) =>
        gqlClient
          .request<{ deleteMessage: Pick<Message, 'id' | 'is_deleted'> }>(DELETE_MESSAGE, {
            message_id:         messageId,
            room_id:            roomId,
            requesting_user_id: profile?.id,
          })
          .then((d) => d.deleteMessage),
   
      onSuccess: (result) => {
        queryClient.setQueryData<InfiniteData<Message[]>>(
          messageKeys.list(roomId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) =>
                page.map((m) =>
                  m.id === result.id ? { ...m, is_deleted: true, content: '' } : m,
                ),
              ),
            };
          },
        );
      },
    });
}


export function useMarkRead() {
    return useMutation({
        mutationFn: (data: {room_id: string; user_id: string; message_id: string}) => 
                gqlClient.request<{markRead: MessageRead}>(MARK_READ,{input: data})
                .then((d) => d.markRead)
    })
}

export function useInjectMessage(roomId: string) {
    const queryClient = useQueryClient();
   
    return useCallback(
      (message: Message) => {
        queryClient.setQueryData<InfiniteData<Message[]>>(
          messageKeys.list(roomId),
          (old) => {
            if (!old) {
              return { pages: [[message]], pageParams: [undefined] }
            }

            // If a matching optimistic message exists, replace it with the real one
            let replacedOptimistic = false
            const pagesWithReplace = old.pages.map((page) =>
              page.map((m) => {
                if (
                  !replacedOptimistic &&
                  m.id.startsWith('optimistic-') &&
                  m.sender_id === message.sender_id &&
                  m.content === message.content
                ) {
                  replacedOptimistic = true
                  return message
                }
                return m
              }),
            )
            if (replacedOptimistic) {
              return { ...old, pages: pagesWithReplace }
            }

            // Skip if already exists
            const exists = old.pages.some((p) => p.some((m) => m.id === message.id));
            if (exists) return old;

            return {
              ...old,
              pages: [[message, ...old.pages[0]], ...old.pages.slice(1)],
            };
          },
        );
      },
      [queryClient, roomId],
    );
  }
