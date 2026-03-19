import { InputType, Int, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsPhoneNumber} from "class-validator"

@InputType()
export class CreateUserInput {
  @Field(() => Int, { description: 'ID of the user' })
  id: number

  @Field(() => String, { description: 'Name of the user' })
  name: string

  @Field(() => String, { description: 'Email of the user' })
  @IsEmail({},{message: 'Email not valid'})
  email: string

  @Field(() => String, { description: 'Password of the user' })
  password: string

  // @Field(() => String, { description: 'Phone number of the user' })
  // @IsPhoneNumber('EG', {message: 'Phone number not valid'})
  // phone: string
}
