import { Injectable, Logger } from '@nestjs/common';
import { GeminiConfig } from 'config/gemini-config';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class CodeExecutionService {
    private readonly logger = new Logger(CodeExecutionService.name)

    constructor(
        private readonly geminiService: GeminiService
    ) { }


    async codeExecution(problem: string) {
        this.logger.log(`Executing code for a problem: ${problem}`)

        const response = await this.geminiService.generateContent(
            problem,
            {
                model: GeminiConfig.models.chat,
                useCodeExecution: true,
                thinkingBudget: 8192
            }
        )

        return {
            problem,
            response: response.text,
            codeExecution: response.codeExecution || null,
            toolCalls: response.toolCalls,
            toolResults: response.toolResults,
            usage: response.usage,
            cost: this.geminiService.calculateCost(response.usage),
            timestamp: new Date(),
        }
    }

}
