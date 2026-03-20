import { useChatStore } from "@/store/chat.store";
import { useRoomMembers } from "./use-rooms";

export function useTypingIndicator(roomId: string) {
    const typingSet = useChatStore((s) => s.typingUsers[roomId]);
    const { data: members} = useRoomMembers(roomId)

    if(!typingSet || typingSet.size === 0) return null

    const names = [...typingSet]
        .map((uid) => members?.find((m) => m.user_id === uid)?.profile?.username ?? "Someone")
        .filter(Boolean)
    
    if(names.length === 1) return `${names[0]} is typing..`
    if(names.length === 2) return `${names[0]} and ${names[1]} are typing..`
    return `${names[0]} and ${names.length -1} others are typing..`
}