'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Room} from "@/types"

interface RoomItemProps {
    room: Room
}

export function RoomItem({room}: RoomItemProps) {
    const pathname = usePathname()
    const isActive = pathname === `/rooms/${room.id}`
    const roomName = room.name ?? (room.is_group ? 'Group Chat' : 'Direct message')


    return (
        <Link
            href={`/rooms/${room.id}`}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                isActive ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'
            )}
        >
            <span className="text-base select-none" aria-hidden>
            {room.is_group ? '🗨' : '💬'}
            </span>
            <span className="truncate">{roomName}</span>
        </Link>
    )
}