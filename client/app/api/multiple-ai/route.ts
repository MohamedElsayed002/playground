import { streamChat } from "@/lib/ai/stream";
import { prisma } from "@/lib/db";
import { ChatRequestSchema } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request schema
    const parseResult = ChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Invalid request payload", details: parseResult.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { chatId, messages, modelId, mode } = parseResult.data;

    // Call streamChat helper from client/lib/ai/stream.ts
    // We pass our custom onFinish handler to persist the assistant response
    const startTime = Date.now();
    const result = streamChat({
      chatId,
      messages,
      modelId,
      mode,
      onFinish: async ({ text, usage }: any) => {
        try {
          const durationMs = Date.now() - startTime;
          await prisma.message.create({
            data: {
              role: "assistant",
              content: text,
              model: modelId,
              mode: mode,
              promptTokens: usage?.promptTokens,
              completionTokens: usage?.completionTokens,
              durationMs,
              chatId,
            },
          });

          // Automatically update the chat title if it's "New Chat"
          const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            select: { title: true, messages: { take: 1, orderBy: { createdAt: "asc" } } },
          });

          if (chat && chat.title === "New Chat") {
            const firstUserMsg = chat.messages[0]?.content || text;
            const generatedTitle = firstUserMsg.trim().slice(0, 40) + (firstUserMsg.length > 40 ? "..." : "");
            await prisma.chat.update({
              where: { id: chatId },
              data: { title: generatedTitle || "New Chat" },
            });
          }
        } catch (dbError) {
          console.error("Failed to save assistant message to database:", dbError);
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Stream route error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred during streaming",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
