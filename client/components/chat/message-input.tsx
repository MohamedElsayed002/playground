'use client'

import { useState } from "react"
import { useSendMessage } from "@/hooks/use-messages"
import { useSocket } from "@/hooks/use-socket"
import { useAuthStore } from "@/store/auth.store"

interface MessageInputProps {
    roomId: string
}

export function MessageInput({ roomId }: MessageInputProps) {
    const [content, setContent] = useState('')
    const profile = useAuthStore((s) => s.profile)
    const sendMsg = useSendMessage(roomId)
    const { handleKeyPress, stopTyping } = useSocket(roomId)

    const send = () => {
        const trimmed = content.trim()
        if (!trimmed || !profile) return

        sendMsg.mutate({ content: trimmed })
        setContent('')
        stopTyping()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
            return
        }
        handleKeyPress()
    }

    return (
        <div className="border-t bg-white px-4 py-3 flex items-end gap-3">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={stopTyping}
                placeholder="Message.."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                   max-h-32 overflow-y-auto leading-relaxed"
                style={{ height: 'auto' }}
                onInput={(e) => {
                    // Auto-resize: shrink back down when lines are deleted 
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
                }}
            />

            <button
                onClick={send}
                disabled={!content.trim() || sendMsg.isPending}
                className="flex shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                aria-label="Send Message"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
            </button>
        </div>
    )
}