import { ModelDefinition, ModelGroup } from "@/types/model";

export const MODELS: ModelDefinition[] = [
  // OpenAI
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    description: "Most capable OpenAI model",
    provider: "openai",
    contextWindow: 128_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    description: "Fast, multimodal OpenAI model",
    provider: "openai",
    contextWindow: 128_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    description: "Affordable and fast",
    provider: "openai",
    contextWindow: 128_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
  // Anthropic
  {
    id: "claude-opus-4-5",
    label: "Claude Opus",
    description: "Most powerful Claude model",
    provider: "anthropic",
    contextWindow: 200_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet",
    description: "Balanced performance and speed",
    provider: "anthropic",
    contextWindow: 200_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku",
    description: "Fast and compact",
    provider: "anthropic",
    contextWindow: 200_000,
    capabilities: { supportsTools: true, supportsVision: false, supportsStreaming: true },
  },
  // Google
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Google's most capable model",
    provider: "google",
    contextWindow: 1_000_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Fast and efficient",
    provider: "google",
    contextWindow: 1_000_000,
    capabilities: { supportsTools: true, supportsVision: true, supportsStreaming: true },
  },
];

export const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: "openai",
    label: "OpenAI",
    models: MODELS.filter((m) => m.provider === "openai"),
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    models: MODELS.filter((m) => m.provider === "anthropic"),
  },
  {
    provider: "google",
    label: "Google",
    models: MODELS.filter((m) => m.provider === "google"),
  },
];

export const DEFAULT_MODEL_ID = "claude-sonnet-4-5";
