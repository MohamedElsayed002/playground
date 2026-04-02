import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from "fs"

import {
    GeminiResponse,
    GeminiOptions,
    UsageMetadata
} from "./interfaces/gemini-response.interface"
import { GeminiConfig } from 'config/gemini-config';
import { google } from '@ai-sdk/google';
import {
    generateObject,
    generateText,
    streamText
} from 'ai';
import { z } from "zod"


@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name)

    constructor(private configService: ConfigService) {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

        if (!apiKey) {
            throw new Error("API Key is required")
        }
    }

    async generateContent(
        prompt: string,
        options: GeminiOptions = {}
    ): Promise<GeminiResponse> {

        const {
            model = GeminiConfig.models.chat,
            useWebSearch = false,
            useCodeExecution = false,
            fileData = null,
            thinkingBudget = null,
            includeThoughts = false,
            temperature = 0.7,
            maxTokens = 8192
        } = options

        try {
            this.logger.log(`Generating content with model ${model}`)

            const tools: any = {}

            if (useWebSearch) {
                tools.google_search = google.tools.googleSearch({})
            }

            if (useCodeExecution) {
                tools.code_execution = google.tools.codeExecution({})
            }

            let content: any[] | string

            if (fileData) {
                let fileBuffer: Buffer

                if (fileData.isPath) {
                    fileBuffer = fs.readFileSync(fileData.data as string)
                } else if (Buffer.isBuffer(fileData.data)) {
                    fileBuffer = fileData.data
                } else {
                    throw new Error("Invalid file data supplied")
                }

                content = [
                    {
                        type: "text",
                        text: "Summarize for me this pdf",
                    },
                    {
                        type: "file",
                        data: fileBuffer,
                        mediaType: fileData.mimeType
                    },
                ]
            } else {
                content = prompt
            }

            const messages = [
                {
                    role: "user",
                    content
                }
            ]

            // Provider options
            const providerOptions: any = { google: {} };

            if (thinkingBudget !== null || includeThoughts) {
                providerOptions.google.thinkingConfig = {}

                if (thinkingBudget !== null) {
                    providerOptions.google.thinkingConfig.thinkingBudget = thinkingBudget;
                }

                if (includeThoughts) {
                    providerOptions.google.thinkingConfig.includeThoughts = true;
                }
            }

            const result = await generateText({
                model: google(model),
                messages: messages as any,
                tools: Object.keys(tools).length ? tools : undefined,
                providerOptions,
                temperature,
                maxOutputTokens: maxTokens
            })

            // Parse response
            const googleMetadata = result.providerMetadata?.google as any;

            const usage: UsageMetadata = {
                // @ts-expect-error
                promptTokens: result.usage?.promptTokens || 0,
                // @ts-expect-error
                completionTokens: result.usage?.completionTokens || 0,
                totalTokens: result.usage?.totalTokens || 0,
                cachedTokens: googleMetadata?.usageMetadata?.cachedContentTokenCount || 0,
            };

            return {
                text: result.text,
                sources: googleMetadata?.groundingMetadata?.groundingChunks || [],
                codeExecution: googleMetadata?.codeExecutionResults || [],
                usage,
                reasoning: result.reasoning || null,
                toolCalls: result.toolCalls || [],
                toolResults: result.toolResults || [],
                rawResponse: result,
            };
        } catch (error) {
            this.logger.error(`Gemini API Error: ${error.message}`)
            throw error
        }
    }

    async streamContent(prompt: string, options: GeminiOptions = {}) {
        const {
            model = GeminiConfig.models.chat,
            useWebSearch = false,
            useCodeExecution = false,
            temperature = 0.7,
            maxTokens = 8192
        } = options

        try {

            this.logger.log(`Streaming content with model: ${model}`)

            const tools: any = {}

            if (useWebSearch) {
                tools.google_search = google.tools.googleSearch({})
            }

            if (useCodeExecution) {
                tools.code_execution = google.tools.codeExecution({});
            }

            const result = await streamText({
                model: google(model),
                prompt,
                tools: Object.keys(tools).length > 0 ? tools : undefined,
                temperature,
                maxOutputTokens: maxTokens
            })

            return result.textStream
        } catch (error) {
            this.logger.error(`Streaming Error: ${error.message}`)
            throw error
        }
    }

    async generateStructuredObject(prompt: string, options: GeminiOptions = {}) {
        const {
            model = GeminiConfig.models.chat,
            temperature = 0.7,
            maxTokens = 8192
        } = options

        const schema = z.object({
            title: z.string().describe("I want to generate a good title for the movie"),
            summary: z.string().describe("I want to generate a good summary for this movie")
        })

        const result = await generateObject({
            model: google(model),
            prompt,
            schema,
            temperature,
            maxOutputTokens: maxTokens
        })

        return {
            title: result.object.title,
            summary: result.object.summary,
            result: result.object
        }
    }

    calculateCost(usage: UsageMetadata, model: string = 'gemini-2.5-flash'): number {
        const pricing = GeminiConfig.pricing[model];
        if (!pricing) return 0;

        const inputCost = (usage.promptTokens / 1000000) * pricing.inputPer1M;
        const outputCost = (usage.completionTokens / 1000000) * pricing.outputPer1M;
        const cachedSavings = (usage.cachedTokens / 1000000) * pricing.inputPer1M * pricing.cachedDiscount;

        return inputCost + outputCost - cachedSavings;
    }
}

