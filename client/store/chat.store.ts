import { create } from "zustand";

interface ChatState {
  typingUsers: Record<string, Set<string>>;
  onlineUsers: Record<string, Set<string>>;
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;
  setOnline: (roomId: string, userId: string, isOnline: boolean) => void;
  clearRoom: (roomId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  typingUsers: {},
  onlineUsers: {},

  setTyping: (roomId, userId, isTyping) =>
    set((state) => {
      const prev = new Set(state.typingUsers[roomId] ?? []);
      if (isTyping) prev.add(userId);
      else prev.delete(userId);
      return { typingUsers: { ...state.typingUsers, [roomId]: prev } };
    }),

  setOnline: (roomId, userId, isOnline) =>
    set((state) => {
      const prev = new Set(state.onlineUsers[roomId] ?? []);
      if (isOnline) prev.add(userId);
      else prev.delete(userId);
      return { onlineUsers: { ...state.onlineUsers, [roomId]: prev } };
    }),

  clearRoom: (roomId) =>
    set((state) => {
      const t = { ...state.typingUsers };
      const o = { ...state.onlineUsers };
      delete t[roomId];
      delete o[roomId];
      return { typingUsers: t, onlineUsers: o };
    }),
}));
