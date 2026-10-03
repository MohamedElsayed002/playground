import {
  addProductToCart,
  checkoutCart,
  deleteProductFromCartServer,
  getCartSummary,
  getProductByName,
  getSingleProductDetailsServer,
  getUserOrderHistory,
} from "@/tools/server";
import { chat, toServerSentEventsResponse, type AnyTextAdapter } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await req.json();

  try {
    const stream = chat({
      adapter: openaiText("gpt-5") as unknown as AnyTextAdapter,
      messages,
      tools: [
        getProductByName,
        addProductToCart,
        getCartSummary,
        checkoutCart,
        getUserOrderHistory,
        getSingleProductDetailsServer,
        deleteProductFromCartServer,
      ],
      systemPrompts: [
        "You are an ecommerce shopping assistant for a store. Your job is to help the user discover products, add items to cart, guide checkout, and answer questions about their order history. " +
          "Be concise, helpful, and sales-focused. " +
          "When the user asks to search, use the product search tool. " +
          "When the user asks for detailed information about a specific product, use the getSingleProductDetailsServer tool with that product's id; if you do not know the id, search for the product first. " +
          "When the user asks to add something to cart, call the add-to-cart tool with the correct product id. " +
          "When the user asks what is in their cart, asks for a cart summary, item count, or subtotal, call the get_cart_summary tool and explain the product names, quantities, and subtotal from its result. " +
          "When the user asks to remove a product from the cart, use remove_product_from_cart with the product ID. If they give a product name, call get_cart_summary to find its product.id; never guess or use the cart-item ID. If the match is ambiguous or the product is not in the cart, ask for clarification. Confirm removal only after the tool succeeds. " +
          "When the user asks about previous orders, recent purchases, last order, or order history, use the get_user_order_history tool. " +
          "If the user asks for checkout, use the checkout tool with their shipping details. " +
          "If you cannot find a product or the product id is missing, ask a clarifying question instead of guessing. " +
          "Do not invent prices, stock details, or order information if the tool did not return them. " +
          "Prefer short, natural product recommendations with clear next steps.",
      ],
    });

    return toServerSentEventsResponse(stream);
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
