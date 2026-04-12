"use client";

import { useState } from "react";
import { useRooms } from "@/hooks/use-rooms";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { Avatar } from "../users/avatar";
import { RoomItem } from "./room-item";
import { CreateRoomModal } from "./create-room-modal";

export function RoomList() {
  const { data: rooms, isLoading } = useRooms();
  const profile = useAuthStore((s) => s.profile);
  const logout = useLogout();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <aside className="w-64 flex flex-col border-r bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Chats</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="w-7 h-7 rounded-lg bg-blue-600 text-white text-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="New chat"
        >
          +
        </button>
      </div>

      {/* Room List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {isLoading &&
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse mx-1" />
          ))}

        {!isLoading && rooms?.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6 px-2">
            No chats yet. Create one to get started!
          </p>
        )}

        {rooms?.map((room) => (
          <RoomItem key={room.id} room={room} />
        ))}
      </nav>

      {/* Current user footer */}
      <div className="border-t px-3 py-2 flex items-center gap-2">
        <Avatar
          username={profile?.username ?? "?"}
          avatarUrl={profile?.avatarUrl}
          isOnline={true}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile?.username}</p>
          <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
        </div>

        <button
          onClick={() => logout.mutate()}
          title="Signout"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ⎋
        </button>
      </div>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} />}
    </aside>
  );
}
