import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class GenerateTextRequestDto {
  @ApiProperty({
    description: 'The prompt to generate text from',
    example: 'Write a short story about a robot',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description: 'Optional generation parameters',
    type: Object,
    required: false,
    example: {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
    },
  })
  @IsOptional()
  @IsObject()
  options?: any;
}

export class GenerateTextResponseDto {
  @ApiProperty({
    description: 'Generated text content',
    example: 'Once upon a time, there was a robot...',
  })
  text: string;

  @ApiProperty({
    description: 'Sources if web search was used',
    type: [Object],
    required: false,
  })
  sources?: Array<{ text: string; url?: string }>;

  @ApiProperty({
    description: 'Token usage metrics',
    type: Object,
  })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiProperty({
    description: 'Tool calls if any',
    type: [Object],
    required: false,
  })
  toolCalls?: any[];

  @ApiProperty({
    description: 'Tool results if any',
    type: [Object],
    required: false,
  })
  toolResults?: any[];
}

export class StreamTextRequestDto {
  @ApiProperty({
    description: 'The prompt to stream text from',
    example: 'Write a short story about a robot',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description: 'Optional generation parameters',
    type: Object,
    required: false,
    example: {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
    },
  })
  @IsOptional()
  @IsObject()
  options?: any;
}

export class GenerateObjectRequestDto {
  @ApiProperty({
    description: 'The prompt to generate structured object from',
    example: 'Generate a user profile with name, age, and email',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description: 'Optional generation parameters including schema',
    type: Object,
    required: false,
    example: {
      model: 'gemini-2.5-flash',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      },
    },
  })
  @IsOptional()
  @IsObject()
  options?: any;
}

export class GenerateObjectResponseDto {
  @ApiProperty({
    description: 'Generated structured object',
    type: Object,
    example: {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
    },
  })
  object: any;

  @ApiProperty({
    description: 'Token usage metrics',
    type: Object,
  })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

