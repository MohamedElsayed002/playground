'use client'

import { useRoom, useRoomMembers } from "@/hooks/use-rooms"

interface RoomHeaderProps {
    roomId: string
}

export function RoomHeader({roomId}: RoomHeaderProps) {
    const { data: room} = useRoom(roomId)
    const { data: members} = useRoomMembers(roomId)

    const title = room?.name ?? (room?.is_group ? 'Group chat' : 'Direct message')
    const memberCount = members?.length ?? 0
    const onlineCount = members?.filter((m) => m.profile?.is_online).length ?? 0

    return (
        <header className="h-14 border-b bg-white px-5 flex items-center gap-3 flex shrink-0">
            <span className="text-xl select-none" aria-hidden>
            {room?.is_group ? '🗨' : '💬'}
            </span>

            <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-gray-800 truncate">{title}</h1>
                {room && (
                    <p className="text-xs text-gray-400">
                        {memberCount} member{memberCount !== 1 ? 's':''}
                        {onlineCount > 0 && (
                            <span className="text-green-500 ml-1">
                                · {onlineCount} online
                            </span>
                        )}
                        {room.description && (
                            <span className="ml-2 text-gray-400">
                                — {room.description}
                            </span>
                        )}
                    </p>
                )}
            </div>
        </header>
    )
}