
import { addProductToCart, checkoutCart, getProductByName } from "@/tools/server"
import { chat, toServerSentEventsResponse, type AnyTextAdapter } from "@tanstack/ai"
import { openaiText } from "@tanstack/ai-openai"

export async function POST(req: Request) {

    if (!process.env.OPENAI_API_KEY) {
        return new Response(
            JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
            status: 500,
            headers: {
                "Content-Type": "application.json"
            }
        }
        )
    }

    const { messages } = await req.json()

    try {
        const stream = chat({
            adapter: openaiText("gpt-5") as unknown as AnyTextAdapter,
            messages,
            tools: [
                // Search By Category,
                // Search By Product,
                getProductByName,
                // Add To Cart 
                addProductToCart,
                // Checkout to open session
                checkoutCart
            ]
        })

        return toServerSentEventsResponse(stream)
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "An error occurred",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

}