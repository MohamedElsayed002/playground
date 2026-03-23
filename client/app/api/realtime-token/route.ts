import { realtimeToken } from "@tanstack/ai"
import { openaiRealtimeToken } from "@tanstack/ai-openai"

export async function POST() {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  try {
    const token = await realtimeToken({
      adapter: openaiRealtimeToken({
        model: "gpt-4o-realtime-preview",
      }),
    })

    return new Response(JSON.stringify(token), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
