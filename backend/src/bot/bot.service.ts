import { Injectable, Inject, Logger } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProviderOptions,
  GoogleGenerativeAIProviderMetadata,
} from '@ai-sdk/google';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { generateText } from 'ai';
import { Bot, BotDocument } from './schema/bot.schema';

// I finished my google quota. I'm using openai now
// this code only works with google not with openai 
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const cacheManager = new GoogleAICacheManager(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
);

@Injectable()
export class BotService {
  private readonly CACHE_KEY = 'all_chats';
  private readonly CACHE_TTL = 60000;
  private readonly logger = new Logger(BotService.name);

  constructor(
    // @InjectModel(Bot.name) private botModel: Model<Bot>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createBot(
    bot: Omit<Bot, '_id'>,
  ): Promise<{ text: string; providerMetadata: string; reason: string }> {
    // await this.botModel.create({
    //   role: 'user',
    //   content: bot.content,
    // });

    const { text, reasoning, providerMetadata } = await generateText({
      model: google('gemini-3-flash-preview'),
      prompt: bot.content,
      temperature: 0.7,
      maxOutputTokens: 1000,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 200,
            thinkingLevel: 'high',
            includeThoughts: true,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_LOW_AND_ABOVE',
            },
          ],
        } as GoogleGenerativeAIProviderOptions,
      },
    });

    // await this.botModel.create({
    //   role: 'system',
    //   content: text,
    // });

    await this.cacheManager.del(this.CACHE_KEY);

    return {
      text,
      providerMetadata: JSON.stringify(providerMetadata),
      reason: JSON.stringify(reasoning),
    };
  }

  async generateFood() {
    try {
      const model = 'gemini-2.5-flash';

      const { name: cachedContent } = await cacheManager.create({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Food' }],
          },
        ],
        ttlSeconds: 60 * 5,
      });

      const { text: veggieLasangaRecipe } = await generateText({
        model: google(model),
        prompt: 'Write a vegetarian lasgna recipe for 4 people',
        providerOptions: {
          google: {
            cachedContent,
          },
        },
      });

      const { text: meatLasangaRecipe } = await generateText({
        model: google(model),
        prompt: 'Write a meat lasgna recipe for 12 people',
        providerOptions: {
          google: {
            cachedContent,
          },
        },
      });

      return {
        cachedContent: cachedContent,
        response2: veggieLasangaRecipe,
        response: meatLasangaRecipe,
      };
    } catch (error) {
      return error;
    }
  }

  async codeExec() {
    try {
      const { text, toolCalls, toolResults } = await generateText({
        model: google('gemini-2.5-flash'),
        tools: {
          code_execution: google.tools.codeExecution({}),
        },
        prompt: 'Use python to calculate the 20th fibonacci number',
      });

      return {
        text,
        toolCalls,
        toolResults,
      };
    } catch (error) {
      return error;
    }
  }

  async googleSearch() {
    try {
      const { text, sources, providerMetadata } = await generateText({
        model: google('gemini-2.5-flash'),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        prompt: `
                    What is the latest 5 news happend in Egypt, and USA
                    I want you include the data of each article
                `,
      });

      const metadata = providerMetadata?.google as
        | GoogleGenerativeAIProviderMetadata
        | undefined;

      return {
        text,
        sources,
        providerMetadata,
        metadata,
      };
    } catch (error) {
      return error;
    }
  }

  async getAllChats(): Promise<BotDocument[]> {
    const cachedChats = await this.cacheManager.get<BotDocument[]>(
      this.CACHE_KEY,
    );

    if (cachedChats) {
      return cachedChats;
    }

    const chats = []
    // const chats = await this.botModel.find().exec();

    await this.cacheManager.set(this.CACHE_KEY, chats, this.CACHE_TTL);
    return chats;
  }
}
