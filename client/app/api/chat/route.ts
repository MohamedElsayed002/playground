import { deleteUser, getTotalUsers, getUserData, getUsersByName, updateUser } from "@/tools/server";
import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import { openaiText } from "@tanstack/ai-openai";


export async  function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return new Response(
            JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        )
    }

    const { messages } = await req.json()

    try {
        const stream = chat({
            adapter: openaiText('gpt-4o-mini'),
            messages,
            tools: [getUserData, updateUser, deleteUser, getUsersByName,getTotalUsers]
        })

        return toServerSentEventsResponse(stream)
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "An error occurred"
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        )
    }
}
