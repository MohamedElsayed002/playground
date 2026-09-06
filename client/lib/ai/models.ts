import { z } from "zod"
import { MODELS } from "@/constants/models"
import type { ModelDefinition } from "@/types/model"

const modelIds = MODELS.map((m) => m.id) as [string, ...string[]]

export const ModelIdSchema = z.enum(modelIds)
export type ModelId = z.infer<typeof ModelIdSchema>

export const MODEL_REGISTRY = new Map<string, ModelDefinition>(
    MODELS.map((m) => [m.id, m])
)

export function getModelDefinition(id: string) : ModelDefinition {
    const model = MODEL_REGISTRY.get(id)
    if(!model) throw new Error(`Unknown model ID: "${id}". Check your constants/models.ts.`)
    return model
}

export function isValidModelId(id: string): id is ModelId {
    return MODEL_REGISTRY.has(id)
}