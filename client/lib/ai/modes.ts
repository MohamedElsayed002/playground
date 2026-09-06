import { z } from "zod" 
import { MODE_CONFIGS} from "@/constants/modes"
import type { ChatMode } from "@/constants/modes"
import { ModeConfig } from "@/constants/modes"

export const ChatModeSchema = z.enum(["chat","build","research","agent"])

export function getModeConfig(mode: ChatMode): ModeConfig {
    const config = MODE_CONFIGS[mode]
    if(!config) throw new Error(`Unknown chat mode: ${mode}`)
    return config
}

export function buildSystemPrompt(mode:ChatMode): string {
    return getModeConfig(mode).systemPrompt
}

export function getModeTemperature(mode: ChatMode): number {
    return getModeConfig(mode).temperature
}