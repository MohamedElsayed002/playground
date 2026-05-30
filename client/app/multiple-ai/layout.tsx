import React from "react";
import { Sidebar } from "./components/Sidebar";
import { getChats } from "./actions";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ chatId?: string }>;
}

export default async function MultipleAiLayout({ children, params }: LayoutProps) {
  const chats = await getChats();
  const { chatId } = await params;

  // Map Date objects to string/Date for Sidebar compatibility
  const formattedChats = chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    mode: chat.mode,
    createdAt: chat.createdAt,
  }));

  return (
    <div className="h-screen flex bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <Sidebar chats={formattedChats} activeChatId={chatId} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_60%,_#000000_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        
        {/* Children Render */}
        <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
