import { streamText } from "ai";
import { resolveModel } from "./providers";

import { ChatModeSchema, getModeConfig } from "./modes";
// import { activeTools } from "./tools";
import { ChatMode } from "@/constants/modes";
import { activeTools } from "./tools";
import { buildFullSystemPrompt, generateChatTitle } from "./prompt";

type StreamChatOptions = {
  chatId: string;
  messages: any;
  modelId: string;
  mode: ChatMode;
  onFinish?: (event: any) => Promise<void> | void;
};

/**
 * Core streaming function used by the API route.
 * Returns a Vercel AI SDK streamText result ready to be converted to a Response.
 */
export function streamChat({
  messages,
  modelId,
  mode,
  onFinish,
}: StreamChatOptions) {
  const model = resolveModel(modelId);
  const modeConfig = getModeConfig(mode);
  const system = buildFullSystemPrompt({ mode });
  const tools = activeTools(modeConfig.tools);

  return streamText({
    model,
    system,
    messages,
    temperature: modeConfig.temperature,
    ...(Object.keys(tools).length > 0 ? { tools } : {}),
    onFinish,
  });
}

export { generateChatTitle };
