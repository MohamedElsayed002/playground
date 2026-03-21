'use client'

import { useEffect, useRef } from "react"
import { useMessages, useMarkRead } from "@/hooks/use-messages"
import { useAuthStore } from "@/store/auth.store"
import { MessageBubble } from "./member-bubble"
import { TypingIndicator } from "./typing-indicator"

interface MessageListProps {
    roomId: string
}

export function MessageList({roomId}: MessageListProps) {
    const profile = useAuthStore((s) => s.profile)
    const markRead = useMarkRead()
    const bottomRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useMessages(roomId)

    // Flatten pages (each page is newest-first) then reverse for display
    // so oldest appears at the top, newest at the bottom - natural chat order
    const allMessages = data?.pages.flat().slice().reverse() ?? []

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    },[allMessages.length])


    // Mark last message as read whenever messages update 
    useEffect(() => {
        const last = allMessages[allMessages.length - 1]
        const isUuid = (value: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

        if(last && profile && isUuid(last.id)) {
            markRead.mutate({
                room_id: roomId,
                user_id: profile.id,
                message_id: last.id
            })
        }
    },[allMessages.length, roomId, profile?.id])


    if(isLoading) {
        return (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[...Array(6)].map((_,i) => (
                    <div
                        key={i}
                        className={`flex items-start gap-2.5 animate-pulse ${i % 3 === 0 ? 'flex-row-reverse' : ''}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex shrink-0" />
                        <div className="space-y-1.5">
                            <div className="h-2.5 w-20 bg-gray-200 rounded-md" />
                            <div className={`h-10 bg-gray-200 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div ref={listRef} className="flex-1 overflow-y-auto flex flex-col">
            {hasNextPage && (
                <div className="flex justify-center py-3">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                    >
                        {isFetchingNextPage ? 'Loading.' : 'Load older messages'}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {allMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No messages yet. Say Hallo
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 py-1 space-y-0.5">
                {allMessages.map((msg) => (
                    <MessageBubble key={msg.id} roomId={roomId} message={msg} />
                ))}
            </div>

            {/* Typing indicator */}
            <TypingIndicator roomId={roomId} />

            {/* Invisible anchor for auto-scroll */}
            <div ref={bottomRef} />
        </div>
    )


}
