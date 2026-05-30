"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, Bot, Code2, Search, Zap, Cpu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { MODELS } from "@/constants/models";
import { CHAT_MODES, ChatMode } from "@/constants/modes";
import { saveUserMessage } from "../actions";
import { Markdown } from "./Markdown";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string | null;
  mode?: ChatMode | string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  durationMs?: number | null;
  createdAt: Date;
}

interface ChatContainerProps {
  chatId: string;
  initialMessages: Message[];
  initialModelId?: string;
  initialMode?: ChatMode;
}

export function ChatContainer({
  chatId,
  initialMessages,
  initialModelId = "gemini-2.0-flash",
  initialMode = "chat",
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(initialModelId);
  const [selectedMode, setSelectedMode] = useState<ChatMode>(initialMode);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating]);

  // Sync messages when active chatId changes
  useEffect(() => {
    setMessages(initialMessages);
    setSelectedModel(initialModelId);
    setSelectedMode(initialMode);
  }, [chatId, initialMessages, initialModelId, initialMode]);

  // Parse Vercel AI SDK text stream chunk
  const parseChunk = (chunk: string): string => {
    let text = "";
    // SDK streams data in lines like: 0:"content"\n
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith('0:')) {
        try {
          const parsed = JSON.parse(line.slice(2));
          if (typeof parsed === "string") {
            text += parsed;
          }
        } catch {
          // Fallback parsing if JSON parsing fails on partial chunk
          const match = line.match(/^0:"(.*)"$/);
          if (match) {
            text += match[1];
          }
        }
      }
    }
    return text;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    setIsGenerating(true);
    setInput("");

    // 1. Save user message to database
    let savedUserMsg: Message;
    try {
      const dbMsg = await saveUserMessage({
        chatId,
        content: textToSend,
        modelId: selectedModel,
        mode: selectedMode,
      });
      savedUserMsg = {
        ...dbMsg,
        role: dbMsg.role as any,
        createdAt: new Date(dbMsg.createdAt),
      };
      
      // Append user message to state
      setMessages((prev) => [...prev, savedUserMsg]);
    } catch (err) {
      console.error("Failed to save user message:", err);
      setIsGenerating(false);
      return;
    }

    // 2. Setup streaming
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Create assistant message placeholder
    const assistantPlaceholderId = "streaming-assistant-placeholder";
    setMessages((prev) => [
      ...prev,
      {
        id: assistantPlaceholderId,
        role: "assistant",
        content: "",
        model: selectedModel,
        mode: selectedMode,
        createdAt: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/multiple-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: textToSend },
          ],
          modelId: selectedModel,
          mode: selectedMode,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate stream: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body reader available");

      let streamedText = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          streamedText += parseChunk(chunk);
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: streamedText }
                : msg
            )
          );
        }
      }

      // Convert placeholder to a formal message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? { ...msg, id: `msg-assistant-${Date.now()}` }
            : msg
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream generation aborted by user.");
      } else {
        console.error("Error during streaming:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholderId
              ? { ...msg, content: msg.content + "\n\n*Error: Connection lost or generation failed.*" }
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const renderProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return <Zap className="h-3.5 w-3.5 text-orange-400" />;
      case "anthropic":
        return <Cpu className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-cyan-400" />;
    }
  };

  const renderModeIcon = (mode: string) => {
    switch (mode) {
      case "build":
        return <Code2 className="h-3.5 w-3.5 text-emerald-400" />;
      case "research":
        return <Search className="h-3.5 w-3.5 text-blue-400" />;
      case "agent":
        return <Bot className="h-3.5 w-3.5 text-purple-400" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  const starters = [
    {
      title: "Write a React Hook",
      desc: "Implement debounce logic with clean Typescript types",
      prompt: "Write a complete custom React hook `useDebounce` in TypeScript, including a code execution example showing how it is used.",
      mode: "build",
      model: "gemini-2.0-flash",
    },
    {
      title: "SQL vs NoSQL Design",
      desc: "Compare transactional speed vs flexibility",
      prompt: "Explain the architecture differences between Postgres (SQL) and MongoDB (NoSQL). Design a database schema for an e-commerce catalog in both, comparing pros and cons.",
      mode: "research",
      model: "gemini-2.5-pro",
    },
    {
      title: "Code review helper",
      desc: "Analyze safety issues in a JWT sign method",
      prompt: "Can you analyze standard JWT token security risks and write a secure Node.js JWT signing & verification middleware implementation?",
      mode: "chat",
      model: "gpt-4o-mini",
    },
    {
      title: "AI Agent Workflow",
      desc: "Explain multi-agent state machines",
      prompt: "Explain the concept of an AI Agent. Describe how LangGraph or state machines are used to control autonomous agent workflows step by step.",
      mode: "agent",
      model: "gemini-2.0-flash",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 relative">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-slate-900 flex items-center justify-between px-6 bg-slate-950/30 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Active Model</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                {MODELS.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="focus:bg-slate-800 focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      {renderProviderIcon(model.provider)}
                      <span>{model.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5">
            <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as ChatMode)}>
              <SelectTrigger className="w-[140px] bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                {CHAT_MODES.map((cfg) => (
                  <SelectItem
                    key={cfg.id}
                    value={cfg.id}
                    className="focus:bg-slate-800 focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      {renderModeIcon(cfg.id)}
                      <span>{cfg.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Message History area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-center py-12">
            <div className="text-center mb-10">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                <Sparkles className="h-6 w-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Configure & Query</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Select your LLM engine, choose the task mode, and send a message. Every conversation is automatically persisted.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {starters.map((starter, idx) => (
                <Card
                  key={idx}
                  onClick={() => {
                    setSelectedMode(starter.mode as ChatMode);
                    setSelectedModel(starter.model);
                    handleSend(starter.prompt);
                  }}
                  className="p-5 bg-slate-950/40 border-slate-850/60 hover:border-indigo-500/50 hover:bg-slate-950/80 cursor-pointer rounded-2xl transition-all duration-300 group shadow-md shadow-black/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 text-sm md:text-base transition-colors">
                      {starter.title}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{starter.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isStreamingPlaceholder = msg.id === "streaming-assistant-placeholder";

              return (
                <div
                  key={msg.id || index}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl p-4.5 transition-all shadow-md",
                    isUser
                      ? "ml-auto bg-gradient-to-br from-indigo-600/90 to-indigo-700/90 border border-indigo-500/20 text-white shadow-indigo-950/20"
                      : "mr-auto bg-slate-950/60 border border-slate-850/50 text-slate-200 shadow-black/20"
                  )}
                >
                  {/* Bubble Content */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</div>
                  ) : (
                    <div className="relative">
                      <Markdown content={msg.content} />
                      {isStreamingPlaceholder && isGenerating && (
                        <span className="inline-block h-4 w-1.5 bg-indigo-400 ml-1 animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Metadata labels */}
                  {!isUser && msg.model && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          {renderProviderIcon(msg.model.split("-")[0])}
                          {MODELS.find((m) => m.id === msg.model)?.label || msg.model}
                        </span>
                        <span className="h-1 w-1 bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1 uppercase tracking-wider">
                          {renderModeIcon(msg.mode || "chat")}
                          {msg.mode}
                        </span>
                      </div>
                      {msg.durationMs && (
                        <span>
                          {msg.promptTokens && `In: ${msg.promptTokens} · Out: ${msg.completionTokens} · `}
                          {(msg.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input controls area */}
      <div className="p-6 bg-slate-950/20 backdrop-blur-md border-t border-slate-900/60">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-950/60 border border-slate-800 p-2.5 rounded-2xl focus-within:border-indigo-500/50 shadow-inner shadow-black/20">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder={
              isGenerating
                ? "AI is writing..."
                : `Message multiple-ai (${MODELS.find((m) => m.id === selectedModel)?.label})...`
            }
            className="flex-1 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder-slate-500 resize-none min-h-[44px] max-h-[160px] text-sm md:text-base custom-scrollbar"
            rows={1}
            disabled={isGenerating}
          />
          
          {isGenerating ? (
            <Button
              onClick={handleStop}
              className="h-10 px-4 bg-red-600/95 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow shadow-red-950/50"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow shadow-indigo-950/50 transition-all disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
