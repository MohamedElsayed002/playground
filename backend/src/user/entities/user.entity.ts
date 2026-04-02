import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  // @Field(() => Int, { description: 'ID of the user'})
  // id: number

  // @Field(() => String, { description: 'Name of the user'})
  // name: string

  // @Field(() => String, { description: 'Email of the user'})
  // email: string

  // @Field(() => String, { description: 'Password of the user'})
  // password: string

  @Field(() => ID, { description: 'User ID' }) id: string;
  @Field(() => String) name: string;
  @Field(() => String) lastName: string;
  @Field(() => String) bio: string;
  @Field(() => String) image: string;
  @Field(() => String) sex: string;
  @Field(() => String) phoneNumber: string;
}

@ObjectType()
export class UserData {
  @Field(() => [User], { description: 'all users' }) users: User[];
  @Field(() => Number, { description: 'Total users' }) usersCount: number;
}

@ObjectType()
export class Users {
  @Field(() => Int, { description: 'Status of the users' })
  status: number;

  @Field(() => [User], { description: 'Data of the users' })
  data: User[];

  @Field(() => Int, { description: 'Count of the users' })
  count: number;
}

@ObjectType()
export class UserRemoved {
  @Field(() => Int, { description: 'Status of the user removed' })
  status: number;

  @Field(() => String, { description: 'Message of the user removed' })
  message: string;
}
