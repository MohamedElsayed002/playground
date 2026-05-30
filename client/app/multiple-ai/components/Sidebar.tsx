"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2, Bot, Code2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteChat, createChat } from "../actions";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ChatItem {
  id: string;
  title: string;
  mode: string;
  createdAt: Date;
}

interface SidebarProps {
  chats: ChatItem[];
  activeChatId?: string;
}

export function Sidebar({ chats, activeChatId }: SidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNewChat = () => {
    startTransition(async () => {
      try {
        const newChat = await createChat("chat");
        router.push(`/multiple-ai/${newChat.id}`);
      } catch (err) {
        console.error("Failed to create new chat:", err);
      }
    });
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm("Are you sure you want to delete this chat?")) {
      startTransition(async () => {
        try {
          await deleteChat(id);
          if (activeChatId === id) {
            router.push("/multiple-ai");
          }
        } catch (err) {
          console.error("Failed to delete chat:", err);
        }
      });
    }
  };

  // Group chats by date
  const getGroupedChats = () => {
    const today: ChatItem[] = [];
    const yesterday: ChatItem[] = [];
    const thisWeek: ChatItem[] = [];
    const older: ChatItem[] = [];

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    chats.forEach((chat) => {
      const date = new Date(chat.createdAt);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / oneDayMs);

      if (diffDays === 0 && date.getDate() === now.getDate()) {
        today.push(chat);
      } else if (diffDays <= 1) {
        yesterday.push(chat);
      } else if (diffDays < 7) {
        thisWeek.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  const grouped = getGroupedChats();

  const renderModeIcon = (mode: string) => {
    switch (mode) {
      case "build":
        return <Code2 className="h-4 w-4 text-emerald-400" />;
      case "research":
        return <Search className="h-4 w-4 text-blue-400" />;
      case "agent":
        return <Bot className="h-4 w-4 text-purple-400" />;
      default:
        return <MessageSquare className="h-4 w-4 text-indigo-400" />;
    }
  };

  const renderChatListSection = (title: string, items: ChatItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
          {title}
        </h4>
        {items.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <div
              key={chat.id}
              onClick={() => router.push(`/multiple-ai/${chat.id}`)}
              className={cn(
                "group relative flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                isActive
                  ? "bg-slate-800/80 border border-slate-700/50 text-white shadow-md shadow-black/20"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-6">
                {renderModeIcon(chat.mode)}
                <span className="text-sm font-medium truncate">{chat.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/80 rounded transition-all duration-150 text-slate-400 hover:text-red-400"
                title="Delete Chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col h-full bg-slate-950/80 border-r border-slate-900 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => router.push("/")} style={{ cursor: 'pointer' }}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-wide text-sm lg:text-base">Multiple AI</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-200 font-medium transition-all shadow-md shadow-black/10 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-5 custom-scrollbar">
        {chats.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-medium">
            No conversation history
          </div>
        ) : (
          <>
            {renderChatListSection("Today", grouped.today)}
            {renderChatListSection("Yesterday", grouped.yesterday)}
            {renderChatListSection("Previous 7 Days", grouped.thisWeek)}
            {renderChatListSection("Older", grouped.older)}
          </>
        )}
      </div>
    </aside>
  );
}
