import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateRoomInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsBoolean()
  is_group: boolean;

  @Field(() => ID)
  @IsUUID()
  created_by: string;

  @Field(() => [ID])
  @IsUUID('4', { each: true })
  member_ids: string[];
}

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @IsUUID()
  room_id: string;

  @Field(() => ID)
  @IsUUID()
  sender_id: string;

  @Field()
  @IsString()
  content: string;

  @Field({ nullable: true, defaultValue: 'text' })
  @IsOptional()
  @IsIn(['text', 'image', 'file', 'system'])
  type?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  reply_to_id?: string;
}

@InputType()
export class EditMessageInput {
  @Field(() => ID)
  @IsUUID()
  message_id: string;

  @Field()
  @IsString()
  content: string;
}

@InputType()
export class GetMessagesInput {
  @Field(() => ID)
  @IsUUID()
  room_id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  before?: string;

  @Field(() => Int, { nullable: true, defaultValue: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@InputType()
export class MarkReadInput {
  @Field(() => ID)
  @IsUUID()
  room_id: string;

  @Field(() => ID)
  @IsUUID()
  user_id: string;

  @Field(() => ID)
  @IsUUID()
  message_id: string;
}



export class ChatRequestDto {
  @ApiProperty({
    description: 'The message to send to the AI',
    example: "What are the latest developments in AI?"
  })
  @IsString()
  @IsNotEmpty()
  message: string

  @ApiProperty({
    description: 'Model to use',
    example: 'gemini-2.5-flash',
    required: false
  })
  @IsOptional()
  @IsString()
  model?: string

  @ApiProperty({
    description: 'Enable web search grounding',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  enableWebSearch?: boolean

  @ApiProperty({
    description: 'Complexity level for thinking budget',
    enum: ['simple', 'medium', 'complex', 'advacned'],
    required: false,
    default: 'medium'
  })
  @IsOptional()
  @IsEnum(['simple', 'medium', 'complex', 'advanced'])
  complexity?: 'simple' | 'medium' | 'complex' | 'advanced'

  @ApiProperty({
    description: 'Temperature for response randomness (0-1)',
    example: 0.7,
    required: false,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiProperty({
    description: 'Maximum tokens to generate',
    example: 8192,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'AI generated response' })
  response: string;

  @ApiProperty({ description: 'Sources from web search', type: [Object] })
  sources: Array<{ text: string; url?: string }>;

  @ApiProperty({ description: 'Token usage metrics' })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens: number;
  };

  @ApiProperty({ description: 'Cache savings information', required: false })
  cacheSavings?: {
    cached: number;
    total: number;
    savingsPercentage: string;
  };

  @ApiProperty({ description: 'Estimated cost in USD' })
  cost: number;

  @ApiProperty({ description: 'Tool calls made', required: false })
  toolCalls?: any[];

  @ApiProperty({ description: 'Tool results', required: false })
  toolResults?: any[];

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: Date;
}