import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type BotDocument = HydratedDocument<Bot>;

@Schema()
export class Bot {
  @ApiProperty({
    description: 'MongoDB document ID',
  })
  _id: string;

  @ApiProperty({
    description: 'Role of the message',
    enum: ['user', 'system'],
    example: 'user',
  })
  @Prop({ required: true })
  role: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'What is the capital of France',
  })
  @Prop({ required: true })
  content: string;
}

export const BotSchema = SchemaFactory.createForClass(Bot);
