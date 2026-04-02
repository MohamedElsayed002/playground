import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Header,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BotService } from './bot.service';
import { BotDocument } from './schema/bot.schema';
import {
  CreateBotRequestDto,
  CreateBotResponseDto,
  BotDocumentDto,
  GenerateFoodResponseDto,
  CodeExecResponseDto,
  GoogleSearchResponseDto,
} from './dto/bot.dto';

@ApiTags('Bot')
@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a new bot conversation',
    description:
      'Create a new bot conversation entry and generates an AI response using Gemini with thinking capabilties',
  })
  @ApiBody({ type: CreateBotRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Bot Conversation created successfully',
    type: CreateBotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createBot(
    @Body() bot: CreateBotRequestDto,
  ): Promise<CreateBotResponseDto> {
    return this.botService.createBot(bot);
  }

  @Get('chats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all chat conversations',
    description:
      'Retrieves all stored chat conversations. Result are cached for 60 seconds',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all chat conversations',
    type: [BotDocumentDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllChats(): Promise<BotDocument[]> {
    return this.botService.getAllChats();
  }

  @Get('caching-food')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate food recipes with caching',
    description:
      'Demonstrates caching functionality by generating vegetarian and meat lasgna recipes using cached food knowledge base',
  })
  @ApiResponse({
    status: 200,
    description: 'Food recipes generated successfully',
    type: GenerateFoodResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async CachedFood(): Promise<GenerateFoodResponseDto> {
    return this.botService.generateFood();
  }


  @Get('code-execution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute code using AI',
    description: 'Demonstrates code execution capabilities by calculating the 20th Fibonacci number using Python',
  })
  @ApiResponse({
    status: 200,
    description: 'Code executed successfully',
    type: CodeExecResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async CodeExec(): Promise<CodeExecResponseDto> {
    return this.botService.codeExec();
  }

  @Get('google-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform Google search using AI',
    description: 'Uses Google Search tool to find latest news from Egypt and USA with article dates',
  })
  @ApiResponse({
    status: 200,
    description: 'Google search completed successfully',
    type: GoogleSearchResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async GoogleSearch(): Promise<GoogleSearchResponseDto> {
    return this.botService.googleSearch();
  }
}
