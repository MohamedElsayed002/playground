'use client'

import { useState } from "react"
import { Avatar } from "../users/avatar"
import { useAuthStore } from "@/store/auth.store"
import { useEditMessage, useDeleteMessage } from "@/hooks/use-messages"
import { formatMessageTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Message } from "@/types"

interface MessageBubbleProps {
    message: Message
    roomId: string
}

export function MessageBubble({ message, roomId }: MessageBubbleProps) {
    const profile = useAuthStore((s) => s.profile)
    const isOwn = message.sender_id === profile?.id

    const editMsg = useEditMessage(roomId)
    const deleteMsg = useDeleteMessage(roomId)

    const [editing, setEditing] = useState(false)
    const [editContent, setEditContent] = useState(message.content)
    const [menuOpen, setMenuOpen] = useState(false)

    if (message.is_deleted) {
        return (
            <div className="flex items-start gap-2.5 px-4 py-1 group">
                <div className="w-9 h-9 flex shrink-0" />
                <p className="text-sm italic text-gray-400">This message was deleted</p>
            </div>
        )
    }

    const submitEdit = () => {
        if (!editContent.trim() || editContent === message.content) {
            setEditing(false)
            return
        }
        editMsg.mutate(
            { message_id: message.id, content: editContent.trim() },
            { onSettled: () => setEditing(false) }
        )
    }

    return (
        <div
            className={cn("flex items-start gap-2.5 px-4 py-1 group hover:bg-gray-50 rounded-lg",
                isOwn && 'flex-row-reverse'
            )}
            onMouseLeave={() => setMenuOpen(false)}
        >
            <Avatar
                username={message.sender?.username ?? '?'}
                avatarUrl={message.sender?.avatar_url}
                size='sm'
            />

            <div className={cn("flex flex-col max-w-[70%]",
                isOwn && 'items-end'
            )}>
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700">
                        {message.sender?.username ?? 'Unknown'}
                    </span>
                    {message.edited_at && (
                        <span className="text-[10px] text-gray-400 italic">(edited)</span>
                    )}
                </div>

                {/* Reply to quote */}
                {message.reply_to && !message.reply_to.is_deleted && (
                    <div className="border-l-2 border-blue-400 pl-2 mb-1 text-xs text-gray-500 truncate max-w-xs">
                        <span className="font-medium">{message.reply_to.sender?.username}: </span>
                        {message.reply_to.content}
                    </div>
                )}

                {/* Content - normal or edit mode */}
                {
                    editing ? (
                        <div className="flex gap-2 w-full">
                            <input
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                                    if (e.key === 'Escape') setEditing(false);
                                }}
                                className="flex-1 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button onClick={submitEdit} className="text-xs text-blue-600 hover:underline">Save</button>
                            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                        </div>
                    ) : (
                        <div
                            className={cn("px-3 py-2 rounded-2xl text-sm leading-relaxed break-words",
                                isOwn ? 'bg-blue-600 text-white rounded-tr-sm' :
                                    'bg-white border text-gray-800 rounded-tl-sm shadow-sm'
                            )}
                        >
                            {message.content}
                        </div>
                    )
                }

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {message.attachments.map((a) => (
                            <a
                                key={a.id}
                                href={a.file_url}
                                target="_blank"
                                rel='noreferrer'
                                className="text-xs text-blue-500 underline hover:text-blue-700"
                            >
                                {a.file_name} file
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Context menu - only for own messages */}
            {isOwn && !editing && (
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="text-gray-400 hover:text-gray-600 px-1 text-sm"
                    >
                        ···
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 bottom-full mb-1 bg-white border rounded-lg shadow-lg text-sm z-10 min-w-[100px]">
                            <button
                                className="block w-full text-left px-3 py-1.5 hover:bg-gray-50"
                                onClick={() => {
                                    setEditing(true);
                                    setMenuOpen(false)
                                }}
                            >
                                Edit
                            </button>
                            <button
                                className="block w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                                onClick={() => {
                                    deleteMsg.mutate(message.id);
                                    setMenuOpen(false)
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}