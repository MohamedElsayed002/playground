export type ModelProvider = "openai" | "anthropic" | "google"

export type ModelCapabilities = {
    supportsTools: boolean
    supportsVision: boolean 
    supportsStreaming: boolean
}

export type ModelDefinition = {
    id: string 
    label: string 
    description: string 
    provider: ModelProvider 
    contextWindow: number
    capabilities: ModelCapabilities
}

export type ModelGroup = {
    provider: ModelProvider
    label: string 
    models: ModelDefinition[]
}