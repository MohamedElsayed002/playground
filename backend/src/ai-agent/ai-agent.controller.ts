import { Body, Controller, Get, Post } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('')
  runAgent(@Body() body: { prompt: string }) {
    return this.aiAgentService.runAgent(body.prompt)
  }
}
