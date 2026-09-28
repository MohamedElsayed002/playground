"use client";

import {
  addToCartTool,
  checkoutCartTool,
  getCartSummaryTool,
  getProductByNameTool,
  getUserOrderHistoryTool,
} from "@/tools/client";
import { openaiRealtime } from "@tanstack/ai-openai";
import { useRealtimeChat } from "@tanstack/ai-react";
import { useEffect, useRef } from "react";

export function RealtimeShopperChatPanel() {
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const {
    status,
    mode,
    messages,
    connect,
    disconnect,
    pendingUserTranscript,
    pendingAssistantTranscript,
  } = useRealtimeChat({
    getToken: () => fetch("/api/realtime-chat", { method: "POST" }).then((response) => response.json()),
    adapter: openaiRealtime(),
    tools: [getUserOrderHistoryTool, getCartSummaryTool, getProductByNameTool, addToCartTool, checkoutCartTool],
    instructions:
      "You are a friendly shopping assistant for this ecommerce store. Help customers discover products, manage their cart, checkout, and review order history. " +
      "Use get_product_by_name to search by the product name the customer says. Product results include IDs: use those IDs internally with add_product_to_cart; never ask the customer to know or provide an ID, and do not mention IDs unless asked. If there are multiple plausible matches, describe them and ask which one they mean before adding. Read the matched product name and price back before adding it. " +
      "Use get_user_order_history for questions about previous orders, purchases, or order status. " +
      "Use get_cart_summary whenever the customer asks what is in the cart, how many items it has, or its subtotal. Explain the returned product names and quantities clearly; do not guess cart contents or totals. " +
      "For checkout, collect the shipping address, city, country, postal code, and any notes. Summarize the details and ask the customer to explicitly confirm placing the order. Call checkout_session only after that confirmation. Never claim an order was placed unless the tool succeeds. Do not invent product, price, stock, or order details.",
    voice: "ash",
  });

  const isActive = status !== "idle";
  const isConnecting = status === "connecting";
  const statusLabel = isConnecting ? "Connecting" : isActive ? "Live" : "Idle";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUserTranscript, pendingAssistantTranscript]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/75 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Voice</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Realtime conversation</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isConnecting
            ? "bg-amber-100 text-amber-700"
            : isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
            }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <p className="min-h-5 flex-1 text-xs leading-relaxed text-slate-500">
          {pendingUserTranscript
            ? `You: ${pendingUserTranscript}...`
            : pendingAssistantTranscript
              ? `Assistant: ${pendingAssistantTranscript}...`
              : isActive
                ? mode === "speaking"
                  ? "Assistant is speaking..."
                  : "Listening..."
                : "Start a voice conversation with the shopping assistant."}
        </p>
        <button
          type="button"
          onClick={isActive ? disconnect : connect}
          disabled={isConnecting}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isActive
            ? "border-red-200 text-red-700 hover:bg-red-50"
            : "border-slate-300 text-slate-800 hover:bg-slate-100"
            }`}
        >
          {isConnecting ? "Connecting..." : isActive ? "End conversation" : "Start voice chat"}
        </button>
      </div>

      <div className="max-h-72 min-h-28 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !pendingUserTranscript && !pendingAssistantTranscript ? (
          <p className="text-sm text-slate-500">Your voice transcript will appear here.</p>
        ) : (
          <>
            {messages.map((message) => {
              const text = message.parts
                .map((part) =>
                  part.type === "text" ? part.content : part.type === "audio" ? part.transcript : "",
                )
                .filter(Boolean)
                .join(" ");
              if (!text) return null;

              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-2xl border px-3 py-2 text-sm ${isUser
                    ? "ml-auto border-blue-100 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-800"
                    }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                    {isUser ? "You" : "Assistant"}
                  </p>
                  {text}
                </div>
              );
            })}
            {pendingUserTranscript && (
              <p className="ml-auto max-w-[88%] rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm italic text-blue-900/70">
                {pendingUserTranscript}...
              </p>
            )}
            {pendingAssistantTranscript && (
              <p className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm italic text-slate-500">
                {pendingAssistantTranscript}...
              </p>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
