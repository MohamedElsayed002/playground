"use client";
// src/components/chat/CreateRoomModal.tsx
// Modal dialog to create a new room.
// • Toggle between DM (2 people) and group (name + many people)
// • member_ids input: comma-separated profile UUIDs
// • Uses useCreateRoom mutation → invalidates room list on success

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { useCreateRoom } from '@/hooks/useRooms';
import { useAuthStore } from "@/store/auth.store";
import { useCreateRoom } from "@/hooks/use-rooms";

interface CreateRoomModalProps {
  onClose: () => void;
}

export function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const profile = useAuthStore((s) => s.profile);
  const createRoom = useCreateRoom();
  const router = useRouter();

  const [isGroup, setIsGroup] = useState(false);
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState(""); // comma-separated UUIDs
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLocalError(null);

    const extraIds = memberIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const uniqueExtra = Array.from(new Set(extraIds));
    const filteredExtra = uniqueExtra.filter((id) => id !== profile.id);

    if (!isGroup) {
      if (filteredExtra.length === 0) {
        setLocalError("Direct message must include another user.");
        return;
      }
      if (filteredExtra.length > 1) {
        setLocalError("Direct message can only include one other user.");
        return;
      }
    }

    createRoom.mutate(
      {
        is_group: isGroup,
        name: isGroup ? name : undefined,
        member_ids: filteredExtra,
      },
      {
        onSuccess: (room) => {
          onClose();
          router.push(`/rooms/${room.id}`);
        },
      },
    );
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">New conversation</h2>

        {/* Toggle DM / Group */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            aria-pressed={!isGroup}
            onClick={() => setIsGroup(false)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
              ${
                !isGroup
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
          >
            Direct message
          </button>
          <button
            type="button"
            aria-pressed={isGroup}
            onClick={() => setIsGroup(true)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
              ${
                isGroup
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
          >
            Group chat
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isGroup && (
            <input
              type="text"
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {isGroup ? "Member profile IDs (comma separated)" : "Their profile ID"}
            </label>
            <input
              type="text"
              placeholder="uuid1, uuid2, …"
              value={memberIds}
              onChange={(e) => setMemberIds(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {(localError || createRoom.error) && (
            <p className="text-red-500 text-xs">
              {localError ?? (createRoom.error as Error).message}
            </p>
          )}

          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRoom.isPending}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createRoom.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
