import type { ChatMode } from "@/constants/modes";
import { buildSystemPrompt } from "./modes";

type PromptContext = {
    mode: ChatMode
    context?: string
}

// Build the full system prompt for a chat request
// Extended this function when adding RAG or tool-calling context

export function buildFullSystemPrompt({ mode, context }: PromptContext): string {
  const base = buildSystemPrompt(mode);

  if (!context) return base;

  return [
    base,
    "",
    "## Relevant context",
    context,
  ].join("\n");
}

// Short title 
export function generateChatTitle(firstMessage: string): string {
    return firstMessage.trim().slice(0,50)
}