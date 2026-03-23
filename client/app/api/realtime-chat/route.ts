import { realtimeToken } from "@tanstack/ai"
import { openaiRealtimeToken } from "@tanstack/ai-openai"


export async function POST(req: Request) {
    const token = await realtimeToken({
        adapter: openaiRealtimeToken({
            model: "gpt-4o-realtime-preview",
        }),
    })

    return new Response(JSON.stringify(token), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    })
}