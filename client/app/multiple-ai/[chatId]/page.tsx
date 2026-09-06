import React from "react";
import { notFound, redirect } from "next/navigation";
import { getChat } from "../actions";
import { ChatContainer } from "../components/ChatContainer";
import { ChatMode } from "@/constants/modes";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatSessionPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const chat = await getChat(chatId);

  if (!chat) {
    redirect("/multiple-ai");
  }

  // Formatting messages for type compatibility
  const initialMessages = chat.messages.map((m) => ({
    id: m.id,
    role: m.role as any,
    content: m.content,
    model: m.model,
    mode: m.mode,
    promptTokens: m.promptTokens,
    completionTokens: m.completionTokens,
    durationMs: m.durationMs,
    createdAt: m.createdAt,
  }));

  // Resolve initial model/mode based on the last assistant message, or default to chat mode settings
  let initialModelId = "gemini-2.0-flash";
  let initialMode: ChatMode = (chat.mode as ChatMode) || "chat";

  // Search backwards to find the last configured model and mode
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    const msg = chat.messages[i];
    if (msg.model) {
      initialModelId = msg.model;
      break;
    }
  }

  return (
    <ChatContainer
      chatId={chatId}
      initialMessages={initialMessages}
      initialModelId={initialModelId}
      initialMode={initialMode}
    />
  );
}
