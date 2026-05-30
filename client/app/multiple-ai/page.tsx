"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createChat, saveUserMessage } from "./actions";

export default function NewChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [selectedMode, setSelectedMode] = useState<ChatMode>("chat");
  const [isCreating, setIsCreating] = useState(false);

  const handleSend = async (textToSend: string, overrideModel?: string, overrideMode?: ChatMode) => {
    if (!textToSend.trim() || isCreating) return;

    setIsCreating(true);
    const model = overrideModel || selectedModel;
    const mode = overrideMode || selectedMode;

    try {
      // 1. Create a new chat session
      const chat = await createChat(mode);

      // 2. Save the user's message
      await saveUserMessage({
        chatId: chat.id,
        content: textToSend,
        modelId: model,
        mode: mode,
      });

      // 3. Redirect to the chat page
      router.push(`/multiple-ai/${chat.id}`);
    } catch (err) {
      console.error("Failed to initialize chat:", err);
      setIsCreating(false);
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
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 relative justify-between">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-slate-900 flex items-center justify-between px-6 bg-slate-950/30 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Active Model</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isCreating}>
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
            <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as ChatMode)} disabled={isCreating}>
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

      {/* Main Landing / Starters */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 flex flex-col justify-center custom-scrollbar">
        <div className="max-w-3xl mx-auto w-full flex flex-col justify-center py-6">
          <div className="text-center mb-10">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Configure & Query</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Select your LLM engine, choose the task mode, and send a message. Every conversation is automatically persisted.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {starters.map((starter, idx) => (
              <Card
                key={idx}
                onClick={() => handleSend(starter.prompt, starter.model, starter.mode as ChatMode)}
                className="p-5 bg-slate-950/40 border-slate-855/60 hover:border-indigo-500/50 hover:bg-slate-950/80 cursor-pointer rounded-2xl transition-all duration-305 group shadow-md shadow-black/10"
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
              isCreating
                ? "Starting conversation..."
                : `Message multiple-ai (${MODELS.find((m) => m.id === selectedModel)?.label})...`
            }
            className="flex-1 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder-slate-500 resize-none min-h-[44px] max-h-[160px] text-sm md:text-base custom-scrollbar"
            rows={1}
            disabled={isCreating}
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isCreating}
            className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow shadow-indigo-950/50 transition-all disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
