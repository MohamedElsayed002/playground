import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateBotRequestDto {
  @ApiProperty({
    description: 'Role of the message',
    enum: ['user', 'system'],
    example: 'user',
  })
  @IsEnum(['user', 'system'])
  @IsNotEmpty()
  role: 'user' | 'system';

  @ApiProperty({
    description: 'Content of the message',
    example: 'What is the capital of France',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateBotResponseDto {
  @ApiProperty({
    description: 'AI generated response text',
    example: 'The capital of france is paris',
  })
  text: string;

  @ApiProperty({
    description: 'Provider metadata as JSON string',
    example: '{"model":"gemini-3-flash-preview"}',
  })
  providerMetadata: string;

  @ApiProperty({
    description: 'Reasoning infromation as JSON string',
    example: '{"thinking":"..."}',
  })
  reason: string;
}

export class BotDocumentDto {
  @ApiProperty({
    description: 'MongoDB document ID',
  })
  _id: string;

  @ApiProperty({
    description: 'Role of the message',
    enum: ['user', 'system'],
    example: 'user',
  })
  role: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'What is the capital of France?',
  })
  content: string;
}

export class GenerateFoodResponseDto {
  @ApiProperty({
    description: 'Cached content identifier',
    example: 'cached-content-name',
    required: false,
  })
  cachedContent?: string;

  @ApiProperty({
    description: 'Vegetarian lasagna recipe response',
    example: 'Vegetarian Lasagna Recipe..',
    required: false,
  })
  response2?: string;

  @ApiProperty({
    description: 'Meat lasagna recipe response',
    example: 'Meat Lasagna Recipe...',
    required: false,
  })
  response?: string;

  @ApiProperty({
    description: 'Error object if request failed',
    required: false,
  })
  error?: any;
}

export class CodeExecResponseDto {
  @ApiProperty({
    description: 'AI Generated text response',
    example: 'The 20th Fibonacci number is 6755',
    required: false,
  })
  text?: string;

  @ApiProperty({
    description: 'Tools calls made during execution',
    type: [Object],
    required: false,
  })
  toolCalls?: any[];

  @ApiProperty({
    description: 'Results from tool calls',
    type: [Object],
    required: false,
  })
  toolResults?: any[];

  @ApiProperty({
    description: 'Error object if request failed',
    required: false,
  })
  error?: any;
}

export class GoogleSearchResponseDto {
  @ApiProperty({
    description: 'AI generated response with search results',
    example: 'Latest news from Egypt and Nigeria',
    required: false,
  })
  text?: string;

  @ApiProperty({
    description: 'Sources from Google Search',
    type: [Object],
    required: false,
  })
  sources?: Array<{ text: string; url?: string }>;

  @ApiProperty({
    description: 'Provider metadata',
    type: Object,
    required: false,
  })
  providerMetadata?: any;

  @ApiProperty({
    description: 'Google-specific metadata',
    type: Object,
    required: false,
  })
  metadata?: any;

  @ApiProperty({
    description: 'Error object if request failed',
    required: false,
  })
  error?: any;
}
