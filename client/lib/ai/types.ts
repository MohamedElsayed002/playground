import type { ChatMode } from "@/constants/modes";
import { ModelDefinition } from "@/types/model";

export type AIMessage = {
    role: "user" | "assistant" | "system"
    content: string
}

export type StreamRequest = {
    chatId: string 
    messages: AIMessage[]
    modelId: string
    mode: ChatMode
}

export type StreamMetadata = {
    model: string
    mode: ChatMode 
    promptTokens: number
    completionTokens: number
    durationMs: number
}

export type ResolvedModel = {
    definition: ModelDefinition
    instance: ReturnType<typeof import("ai").wrapLanguageModel>;
}