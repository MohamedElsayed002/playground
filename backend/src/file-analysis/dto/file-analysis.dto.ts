import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class FileAnalysisRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to analyze (PDF, JPEG, PNG, or WebP)',
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'Optional prompt for custom analysis',
    example: 'Extract all key points and summarize this document',
    required: false,
  })
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class FileAnalysisResponseDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  fileType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'AI generated analysis of the file',
    example: 'This document contains information about...',
  })
  analysis: string;

  @ApiProperty({
    description: 'Sources referenced in the analysis',
    type: [Object],
    required: false,
  })
  sources?: Array<{ text: string; url?: string }>;

  @ApiProperty({
    description: 'Token usage metrics',
    example: {
      promptTokens: 500,
      completionTokens: 300,
      totalTokens: 800,
    },
  })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiProperty({
    description: 'Estimated cost in USD',
    example: 0.0005,
  })
  cost: number;

  @ApiProperty({
    description: 'Analysis timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: Date;
}

