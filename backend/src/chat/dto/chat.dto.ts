import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsIn,
  IsInt,
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
