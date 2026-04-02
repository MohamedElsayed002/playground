import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GeminiService } from './gemini.service';
import {
  GenerateTextRequestDto,
  GenerateTextResponseDto,
  StreamTextRequestDto,
  GenerateObjectRequestDto,
  GenerateObjectResponseDto,
} from './dto/gemini.dto';

@ApiTags('Gemini')
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate text content',
    description: 'Generate text content using Google Gemini AI with customizable options',
  })
  @ApiBody({ type: GenerateTextRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Text generated successfully',
    type: GenerateTextResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async generateText(@Body() body: GenerateTextRequestDto): Promise<GenerateTextResponseDto> {
    const { prompt, options } = body;
    return this.geminiService.generateContent(prompt, options);
  }

  @Post('stream-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stream text content',
    description: 'Generate and stream text content incrementally using Google Gemini AI',
  })
  @ApiBody({ type: StreamTextRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Text streaming started successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async StreamText(@Body() body: StreamTextRequestDto) {
    const { prompt, options } = body;
    return this.geminiService.streamContent(prompt, options);
  }

  @Post('generate-object')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate structured object',
    description: 'Generate a structured JSON object based on a schema using Google Gemini AI',
  })
  @ApiBody({ type: GenerateObjectRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Structured object generated successfully',
    type: GenerateObjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input or schema',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async generatingObject(@Body() body: GenerateObjectRequestDto){
    const { prompt, options } = body;
    return this.geminiService.generateStructuredObject(prompt, options);
  }
}
