import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CodeExecutionRequestDto {
  @ApiProperty({
    description: 'The problem or task description for code execution',
    example: 'Calculate the 20th Fibonacci number using Python',
  })
  @IsString()
  @IsNotEmpty()
  problem: string;
}

export class CodeExecutionResponseDto {
  @ApiProperty({
    description: 'The original problem statement',
    example: 'Calculate the 20th Fibonacci number using Python',
  })
  problem: string;

  @ApiProperty({
    description: 'AI generated response explaining the solution',
    example: 'The 20th Fibonacci number is 6765...',
  })
  response: string;

  @ApiProperty({
    description: 'Code execution results if any code was executed',
    required: false,
    nullable: true,
  })
  codeExecution: any | null;

  @ApiProperty({
    description: 'Tool calls made during execution',
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
    description: 'Token usage metrics',
    example: {
      promptTokens: 150,
      completionTokens: 200,
      totalTokens: 350,
    },
  })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiProperty({
    description: 'Estimated cost in USD',
    example: 0.0001,
  })
  cost: number;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: Date;
}

