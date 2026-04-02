import { Injectable, Logger } from '@nestjs/common';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import {
  ToolLoopAgent,
  stepCountIs,
  tool,
  generateText,
  generateObject,
  ToolSet,
} from 'ai';
import { z } from 'zod';

// https://ai-sdk.dev/docs/agents/workflows

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly weatherAgent;

  constructor() {
    const tools = {
      weather: tool({
        description: 'Get the weather in a location (in Fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          return {
            location,
            temperature: 72 + Math.floor(Math.random() * 21) - 10,
          };
        },
      }),

      convertFahrenheitToCelsius: tool({
        description: 'Convert temperature from Fahrenheit to Celsius',
        inputSchema: z.object({
          temperature: z.number().describe('Temperature in Fahrenheit'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return { celsius };
        },
      }),
    } satisfies ToolSet;

    this.weatherAgent = new ToolLoopAgent({
      model: openai('gpt-4o-mini'),
      tools,
      stopWhen: stepCountIs(10),
      toolChoice: {
        type: 'tool',
        toolName: 'weather',
      },
    });
  }

  async runAgent(prompt: string) {
    this.logger.log(`Running agent with prompt: ${prompt}`);
    const result = await this.weatherAgent.generate({
      prompt,
    });

    return {
      response: result.text,
      steps: result.steps,
    };
  }

  // Sequential Processing
  // This simplest workflow executes steps in a predefined order. Each step's output becomes
  // input for the next step, creating a clear chain of operations. Use this pattern for
  // Tasks will well-defined sequences, like content generation pipelines or data transformation processes
  async GenerateMarketingCopy(input: string) {
    const model = openai('gpt-4o-mini');

    const { text: copy } = await generateText({
      model,
      prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,
    });

    // Peroform quality check on copy
    const { object: qualityMetrics } = await generateObject({
      model,
      schema: z.object({
        hasCallToAction: z.boolean(),
        emotionalAppeal: z.number().min(1).max(10),
        clarity: z.number().min(1).max(10),
      }),
      prompt: `Evaluate this marketing copy for:
            
            1. Persence of call to action (true/false)
            2. Emotional appeal (1-10)
            3. Clarity (1-10)
            `,
    });

    // If quality check fails, regenerate with more specific instructions
    if (
      !qualityMetrics.hasCallToAction ||
      qualityMetrics.emotionalAppeal < 7 ||
      qualityMetrics.clarity < 7
    ) {
      const { text: improvedCopy } = await generateText({
        model,
        prompt: `Rewrite this marketing copy with:
                    ${!qualityMetrics.hasCallToAction ? '- A clear call to action' : ''},
                    ${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotioanl appeal' : ''},
                    ${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}

                    Original Copy: ${copy}
                `,
      });

      return { copy: improvedCopy, qualityMetrics };
    }

    return { copy, qualityMetrics };
  }

  // Routing
  // This patterns lets the model decide which path to take through a workflow based on context
  // and intermmediate results. The model act as an intelligent router, directing the flow of
  // execution between different branches of your workflow. Use this when handling varied
  // inputs that require different processing approaches. In the example below, the first LLM call's
  // results determine the second call's model size and system prompt
  async handleCustomerQuery(query: string) {
    const model = openai('gpt-4o-mini');

    // Firest Step: Classify the query type
    const { object: classification } = await generateObject({
      model,
      schema: z.object({
        reasoning: z.string(),
        type: z.enum(['general', 'refund', 'technical']),
        complexity: z.enum(['simple', 'complex']),
      }),
      prompt: `Classify this customer query:
            
                ${query}

                Determine:
                1- Query type (general, refund, technical)
                2- Complexity (simple or complex)
                3- Breif reasoning for classification
            `,
    });

    // Routing based on classification
    const { text: response } = await generateText({
      model:
        classification.complexity === 'simple'
          ? 'openai/gpt-4.1'
          : 'openai/gpt-4-turbo',
      system: {
        general:
          'You are an expert customer service agent handling general inquiries',
        refund:
          'You are customer service agent specializing in refund requests. Follow company policy and collect necessary information',
        technical:
          'You are a technical support specialist with deep product knowledge. focus on clear step-by-step troubleshooting',
      }[classification.type],
      prompt: query,
    });

    return {
      response,
      classification,
    };
  }

  // Parallel Processing
  // Break down tasks into independent sutasks that execute simultaneously. This pattern
  // uses parallel exuection to improve effiency while mainting the benefits of structured
  // workflows. for example, analyze multiple documnets or process different aspects of a sinle
  // input concurrently (like code review)
  async parallelCodeReview(code: string) {
    const model = openai('gpt-4o-mini');

    const [securityReview, performanceReview, maintainabilityReview] =
      await Promise.all([
        generateObject({
          model,
          system:
            'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues',
          schema: z.object({
            vulnerabilities: z.array(z.string()),
            riskLevel: z.enum(['low', 'medium', 'high']),
            suggestions: z.array(z.string()),
          }),
          prompt: `Review this code: ${code}`,
        }),

        generateObject({
          model,
          system:
            'You are expert in code performance. Focus in identifying performance bottlenecks, memory leaks, and optimization opportunities.',
          schema: z.object({
            issues: z.array(z.string()),
            impact: z.enum(['low', 'medium', 'high']),
            optimizations: z.array(z.string()),
          }),
          prompt: `Review this code ${code}`,
        }),

        generateObject({
          model,
          system:
            'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
          schema: z.object({
            concerns: z.array(z.string()),
            qualityScore: z.number().min(1).max(10),
            recommendations: z.array(z.string()),
          }),
          prompt: `Review this code: ${code}`,
        }),
      ]);

    const reviews = [
      { ...securityReview.object, type: 'security' },
      { ...performanceReview.object, type: 'performance' },
      { ...maintainabilityReview.object, type: 'maintainability' },
    ];

    const { text: summary } = await generateText({
      model,
      system: 'You are technical lead summarizing multiple code reviews',
      prompt: `
                Synthesize these code review results into a concise summary with key actions:
                ${JSON.stringify(reviews, null, 2)}
            `,
    });

    return {
      reviews,
      summary,
    };
  }

  // Orchestrator-Worker
  // A primary model (orchestrator) coordiinates the execution of specialized workers. Each
  // worker optmizes for a specific subtask, while the  orchestrator maintains overall context
  // and ensures coherent results. this pattern excels at complex tasks requring different types
  // of expertise or processing
  async implementFeature(featureRequest: string) {
    const { object: implementationPlan } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        files: z.array(
          z.object({
            purpose: z.string(),
            filePath: z.string(),
            changeType: z.enum(['create', 'modify', 'delete']),
          }),
        ),
        estimatedComplexity: z.enum(['low', 'medium', 'high']),
      }),
      system:
        'You are a senior software architecht planning feature implementations.',
      prompt: `Analyze this feature request and create an implementation plan: ${featureRequest}`,
    });

    // Workers: Executed the planned changes
    const filesChanges = await Promise.all(
      implementationPlan.files.map(async (file) => {
        // Each worker is specialized for the type of change
        const workerSystemPrompt = {
          create:
            'You are an expert at implementing new files following best practices and project patterns',
          modify:
            'You are an expert at modifying existing code while maintaining consistency and avoiding regressions',
          delete:
            'You are an expert at safety removing code while ensuring no breaking changes',
        }[file.changeType];

        const { object: change } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: z.object({
            explanation: z.string(),
            code: z.string(),
          }),
          system: workerSystemPrompt,
          prompt: `Implement the changes for ${file.filePath} to support:

                    ${file.purpose}

                    Consider the overall feature context:
                    ${featureRequest}
                    `,
        });

        return {
          file,
          implementation: change,
        };
      }),
    );

    return {
      plan: implementationPlan,
      changes: filesChanges,
    };
  }

  // Evaluator-Optimizer
  // Add quality control to workflows with dedicated evaluation steps that asses intermmediate
  // results. Based the evaluation, the workflow proceeds, retries with adjusted parameters,
  // or takes corrective action. this creates robust workflows capable of self-improvement and error recovery
  async translateWithFeedback(text: string, targetLanguage: string) {
    let currentTranslation = '';
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    // Initial Transation
    const { text: translation } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are an expert literary translator.',
      prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances: ${text}`,
    });

    currentTranslation = translation;

    // Evaluation-optimization loop
    while (iterations < MAX_ITERATIONS) {
      // Evaluate current
      const { object: evaluation } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          qualityScore: z.number().min(1).max(10),
          preservesTone: z.boolean(),
          preservesNuance: z.boolean(),
          culturallyAccurate: z.boolean(),
          specificIssues: z.array(z.string()),
          improvementSuggestions: z.array(z.string()),
        }),
        system: 'You are an expert in evaluating literary translations',
        prompt: `Evaluate this translation
                
                    Original: ${text}
                    Translation: ${currentTranslation}

                    Consider:
                    1. Overall quality
                    2. Preservation of tone
                    3. Preservation of nuance
                    4. Cultural accuracy
                `,
      });

      // Check if the quality meet threshold
      if (
        evaluation.qualityScore >= 8 &&
        evaluation.preservesTone &&
        evaluation.preservesNuance &&
        evaluation.culturallyAccurate
      ) {
        break;
      }

      // Generate improved translation based on feedback
      const { text: improvedTranslation } = await generateText({
        model: openai('gpt-4o-mini'),
        system: 'You are expert literary translator',
        prompt: `Improve this translation based on the following feedback:

                    ${evaluation.specificIssues.join('\n')}
                    ${evaluation.improvementSuggestions.join('\n')}

                    Original: ${text}
                    Current Translation: ${currentTranslation}
                `,
      });

      currentTranslation = improvedTranslation;
      iterations++;
    }

    return {
      finalTranslation: currentTranslation,
      iterationsRequired: iterations,
    };
  }
}
