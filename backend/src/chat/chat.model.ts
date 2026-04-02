import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field()
  is_online: boolean;

  @Field({ nullable: true })
  last_seen_at?: string;

  @Field()
  created_at: string;

  @Field()
  updated_at: string;
}

@ObjectType()
export class Room {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  is_group: boolean;

  @Field(() => ID, { nullable: true })
  created_by?: string;

  @Field()
  created_at: string;

  @Field()
  updated_at: string;
}

@ObjectType()
export class Message {
  @Field(() => ID)
  id: string;

  @Field(() => ID) room_id: string;
  @Field(() => ID, { nullable: true }) sender_id?: string;
  @Field(() => Profile, { nullable: true }) sender?: Profile;
  @Field() content: string;
  @Field() type: string;
  @Field({ nullable: true }) edited_at?: string;
  @Field() is_deleted: boolean;
  @Field(() => ID, { nullable: true }) reply_to_id?: string;
  @Field(() => Message, { nullable: true }) reply_to?: Message;
  @Field(() => [Attachment], { nullable: true }) attachments?: Attachment[];
  @Field() created_at: string;
  @Field() updated_at: string;
}

@ObjectType()
export class Attachment {
  @Field(() => ID) id: string;
  @Field(() => ID) message_id: string;
  @Field() file_url: string;
  @Field() file_name: string;
  @Field(() => Int, { nullable: true }) file_size?: number;
  @Field({ nullable: true }) mime_type?: string;
  @Field() created_at: string;
}

@ObjectType()
export class RoomMember {
  @Field(() => ID) room_id: string;
  @Field(() => ID) user_id: string;
  @Field() role: string;
  @Field(() => Profile, { nullable: true }) profile?: Profile;
  @Field() joined_at: string;
}

@ObjectType()
export class MessageRead {
  @Field(() => ID) room_id: string;
  @Field(() => ID) user_id: string;
  @Field(() => ID, { nullable: true }) last_read_message_id?: string;
  @Field() read_at: string;
}
