
export type ChatMode = "chat" | "build" | "research" | "agent"
 
export type ModeConfig = {
    id: ChatMode
    label: string 
    description: string 
    icon: string 
    systemPrompt: string 
    temperature: number
    tools: string[]
}


export const MODE_CONFIGS: Record<ChatMode, ModeConfig> = {
  chat: {
    id: "chat",
    label: "Chat",
    description: "General purpose conversation",
    icon: "MessageSquare",
    systemPrompt:
      "You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and thoughtful responses.",
    temperature: 0.7,
    tools: [],
  },
  build: {
    id: "build",
    label: "Build",
    description: "Software engineering and code",
    icon: "Code2",
    systemPrompt:
      "You are an expert software engineer with deep knowledge of architecture, design patterns, and best practices. Focus on writing clean, maintainable, and well-documented code. Always consider edge cases, error handling, and performance.",
    temperature: 0.3,
    tools: ["code_execution"],
  },
  research: {
    id: "research",
    label: "Research",
    description: "Deep analysis and research",
    icon: "Search",
    systemPrompt:
      "You are a meticulous research assistant. Provide comprehensive, well-sourced, and nuanced analysis. Break down complex topics clearly. Acknowledge uncertainty and conflicting evidence. Structure your responses with clear sections.",
    temperature: 0.5,
    tools: ["web_search"],
  },
  agent: {
    id: "agent",
    label: "Agent",
    description: "Autonomous task execution",
    icon: "Bot",
    systemPrompt:
      "You are an autonomous AI agent capable of breaking down complex tasks and executing them step by step. Think carefully about your plan before acting. Use available tools effectively. Report your progress and reasoning clearly.",
    temperature: 0.4,
    tools: ["code_execution", "web_search", "file_ops"],
  },
};

export const DEFAULT_MODE: ChatMode = "chat";

export const CHAT_MODES = Object.values(MODE_CONFIGS);
