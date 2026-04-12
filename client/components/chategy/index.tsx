"use client";

import { useState } from "react";
import { sileo } from "sileo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChategyForm } from "./chategy-form";
import { ChategyResponsePanel } from "./chategy-response";
import { useChategyFileAnalysis, useChategyPrompt } from "@/hooks/use-chategy";
import type { ChategyMode, ChategyResponse } from "@/lib/chategy-api";

export function ChategyWorkspace() {
  const [mode, setMode] = useState<ChategyMode>("code-execution");
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [response, setResponse] = useState<ChategyResponse | null>(null);

  const promptMutation = useChategyPrompt();
  const fileMutation = useChategyFileAnalysis();

  const isLoading = promptMutation.isPending || fileMutation.isPending;

  const handleSubmit = async () => {
    try {
      if (mode === "file-analysis") {
        if (!selectedFile) {
          sileo.error({
            title: "File Required",
            description: "Please select a PDF or image before sending",
          });
          return;
        }

        const fileResult = await fileMutation.mutateAsync({
          file: selectedFile,
          prompt,
        });
        setResponse(fileResult);
        sileo.success({
          title: "File analyzed",
          description: "Analysis successed",
        });
        return;
      }

      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        sileo.error({
          title: "Prompt required",
          description: "Write a prompt before sending.",
        });
        return;
      }

      const result = await promptMutation.mutateAsync({
        mode,
        prompt: trimmedPrompt,
      });
      setResponse(result);
      sileo.success({
        title: "Response received",
        description: `Data fetched from ${mode}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sileo.error({
        title: "Request failed",
        description: message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#cffafe_0%,#e2e8f0_40%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-2">
          <p className="textxs uppercase tracking-[0.3em] text-slate-500">Chategy</p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">AI Playground</h1>
          <p className="text-sm text-slate-600">
            Connect: Gemini, Bot, Code Execution, and File Analysis
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Request builder</CardTitle>
              <CardDescription>Choose send prompt or file input</CardDescription>
              <CardContent>
                <ChategyForm
                  mode={mode}
                  prompt={prompt}
                  selectedFile={selectedFile}
                  isLoading={isLoading}
                  onModeChange={(nextMode) => {
                    setMode(nextMode);
                    setResponse(null);
                  }}
                  onPromptChange={setPrompt}
                  onFileChange={setSelectedFile}
                  onSubmit={handleSubmit}
                />
              </CardContent>
            </CardHeader>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Backend Response</CardTitle>
              <CardDescription>Raw JSON response from selected backend endpoint.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChategyResponsePanel response={response} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
