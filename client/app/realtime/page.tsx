"use client";

import { useMemo, useState } from "react";
import { useRealtimeChat } from "@tanstack/ai-react";
import { openaiRealtime } from "@tanstack/ai-openai";

export default function RealtimeChatPage() {
  const [text, setText] = useState("");

  const adapter = useMemo(() => openaiRealtime(), []);

  const {
    status,
    mode,
    messages,
    connect,
    disconnect,
    pendingUserTranscript,
    pendingAssistantTranscript,
    sendText,
    error,
  } = useRealtimeChat({
    getToken: () => fetch("/api/realtime-token", { method: "POST" }).then((r) => r.json()),
    adapter,
    instructions: "You are a helpful assistant.",
    voice: "alloy",
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendText(trimmed);
    setText("");
  };

  return (
    <main className="min-h-screen overflow-y-scroll bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_40%,_#020617_100%)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Realtime Chat</p>
            <h1 className="text-3xl font-semibold">Live AI Session</h1>
            <p className="mt-2">
              Start a realtime session, speak or send text, and watch transcripts update instantly.
            </p>
          </div>
          <button
            onClick={status === "idle" ? connect : disconnect}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {status === "idle" ? "Start" : "Stop"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            Status: <strong className="text-slate-900">{status}</strong>
          </span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            Mode: <strong className="text-slate-900">{mode}</strong>
          </span>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-700">Live Transcript</div>
          <div className="mt-3 space-y-2 text-sm text-slate-800">
            {pendingUserTranscript && (
              <div>
                <span className="font-semibold text-slate-600">You: </span>
                {pendingUserTranscript}...
              </div>
            )}
            {pendingAssistantTranscript && (
              <div>
                <span className="font-semibold text-slate-600">AI: </span>
                {pendingAssistantTranscript}...
              </div>
            )}
            {!pendingUserTranscript && !pendingAssistantTranscript && (
              <div className="text-slate-500">Waiting for audio or text input...</div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-700">Send Text</div>
          <div className="mt-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              disabled={status === "idle"}
            />
            <button
              onClick={handleSend}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === "idle"}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tip: allow microphone access to enable voice in realtime mode.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
            >
              <div className="font-semibold text-slate-700">{msg.role}</div>
              <div className="mt-2 space-y-1 text-slate-800">
                {msg.parts.map((part, idx) => (
                  <span key={idx} className="block">
                    {part.type === "text" ? part.content : null}
                    {part.type === "audio" ? part.transcript : null}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
