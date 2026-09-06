import { ChatMode, MessageRole } from "@/lib/generated/prisma/enums";

export type CreateChatInput = {
    mode?: ChatMode 
    title?: string
}

export type UpdateChatInput = {
    title?: string 
    mode?: ChatMode
}