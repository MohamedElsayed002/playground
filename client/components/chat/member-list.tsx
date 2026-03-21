'use client'

import { useRoomMembers } from "@/hooks/use-rooms"
import { useChatStore } from "@/store/chat.store"
import { Avatar } from "../user/avatar"
import { OnlineIndicator } from "./online-indicator"


interface MemberListProps {
    roomId: string
}

export function MemberList({roomId}: MemberListProps) {
    const { data: members, isLoading} = useRoomMembers(roomId)

    const onlineSet = useChatStore((s) => s.onlineUsers[roomId])

    if(isLoading) {
        return (
            <aside className="w-56 border-l bg-gray-50 p-4 flex flex-col gap-2">
                {[...Array(4)].map((_,i) => (
                    <div key={i} className="flex items-center gap-2 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="flex-1 h-3 bg-gray-200 rounded" />
                    </div>
                ))}
            </aside>
        )
    }

    const admins = members?.filter((m) => m.role === 'admin') ?? []
    const regular = members?.filter((m) => m.role !== 'admin') ?? []

    // @ts-expect-error
    const renderMember = (m: typeof members[0]) => {
        // isOnline: combine the profile's DB value with the live socket presence
        const isOnline = onlineSet?.has(m.user_id) ?? m.profile?.is_online ?? false;
    
        return (
          <div key={m.user_id} className="flex items-center gap-2.5 py-1">
            <Avatar
              username={m.profile?.username ?? '?'}
              avatarUrl={m.profile?.avatar_url}
              isOnline={isOnline}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{m.profile?.username}</p>
              <OnlineIndicator isOnline={isOnline} className="text-xs" />
            </div>
          </div>
        );
      };
    
      return (
        <aside className="w-56 border-l bg-gray-50 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Members - {members?.length ?? 0}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {admins.length > 0 && (
              <section className="mb-3">
                <p className="text-xs text-gray-400 mb-1 px-1">Admins</p>
                {admins.map(renderMember)}
              </section>
            )}

            {regular.length > 0 && (
              <section>
                <p className="text-xs text-gray-400 mb-1 px-1">Members</p>
                {regular.map(renderMember)}
              </section>
            )}
          </div>
        </aside>
      )
}