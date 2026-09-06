import { createOpenAI} from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { getModelDefinition } from "./models";

// Lazy-initialised provider singletons — avoids creating instances at module
// load time when env vars might not yet be set (e.g. during build).
let _openai: ReturnType<typeof createOpenAI> | null = null;
let _anthropic: ReturnType<typeof createAnthropic> | null = null;
let _google: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    _openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function getAnthropic() {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    _anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

function getGoogle() {
  if (!_google) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not set");
    _google = createGoogleGenerativeAI({ apiKey });
  }
  return _google;
}

/**
 * Resolves a model ID string to a Vercel AI SDK LanguageModel instance.
 * The provider is determined from the model registry — no provider param needed.
 */
export function resolveModel(modelId: string): LanguageModel {
  const definition = getModelDefinition(modelId);

  switch (definition.provider) {
    case "openai":
      return getOpenAI()(modelId) as LanguageModel;
    case "anthropic":
      return getAnthropic()(modelId) as LanguageModel;
    case "google":
      return getGoogle()(modelId) as LanguageModel;
    default:
      throw new Error(`Unsupported provider: ${definition.provider}`);
  }
}
