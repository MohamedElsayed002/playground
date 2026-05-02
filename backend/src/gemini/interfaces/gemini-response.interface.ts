export interface UsageMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
}

export interface CodeExecution {
  code: string;
  language: string;
  result: string;
}

export interface Source {
  text: string;
  url?: string;
}

export interface GeminiResponse {
  text: string;
  sources: Source[];
  codeExecution: CodeExecution | null;
  usage: UsageMetadata;
  reasoning: any;
  toolCalls: any[];
  toolResults: any[];
  rawResponse: any;
}

export interface FileData {
  data: string | Buffer;
  mimeType: string;
  isPath?: string;
}

export interface GeminiOptions {
  model?: string;
  useWebSearch?: boolean;
  useCodeExecution?: boolean;
  fileData?: FileData;
  thinkingBudget?: number;
  includeThoughts?: boolean;
  temperature?: number;
  maxTokens?: number;
}
