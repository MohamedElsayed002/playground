import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => Int, { description: 'ID of the user'})
  id: number 

  @Field(() => String, { description: 'Name of the user'})
  name: string

  @Field(() => String, { description: 'Email of the user'})
  email: string

  @Field(() => String, { description: 'Password of the user'})
  password: string
}


@ObjectType()
export class Users {
  @Field(() => Int, { description: 'Status of the users'})
  status: number 

  @Field(() => [User], { description: 'Data of the users'})
  data: User[]

  @Field(() => Int, { description: 'Count of the users'})
  count: number
}

@ObjectType()
export class UserRemoved {
  @Field(() => Int, { description: 'Status of the user removed'})
  status: number

  @Field(() => String, { description: 'Message of the user removed'})
  message: string
}