"use client";

import { useMutation } from "@tanstack/react-query";
import { chategyApi, ChategyResponse, type ChategyMode } from "@/lib/chategy-api";

type PromptInput = {
  mode: Exclude<ChategyMode, "file-analysis">;
  prompt: string;
};

type FileInput = {
  file: File;
  prompt?: string;
};

export function useChategyPrompt() {
  return useMutation<ChategyResponse, Error, PromptInput>({
    mutationFn: chategyApi.sendPrompt,
  });
}

export function useChategyFileAnalysis() {
  return useMutation<ChategyResponse, Error, FileInput>({
    mutationFn: chategyApi.analyzeFile,
  });
}
