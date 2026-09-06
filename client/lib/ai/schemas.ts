import { z } from "zod"
import { ModelIdSchema } from "./models"
import { ChatModeSchema} from "./modes"

export const AIMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const ChatRequestSchema = z.object({
  chatId: z.string().cuid("Invalid chat ID"),
  messages: z.array(AIMessageSchema).min(1, "At least one message is required"),
  modelId: ModelIdSchema,
  mode: ChatModeSchema,
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
