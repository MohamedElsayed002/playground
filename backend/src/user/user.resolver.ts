import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User, UserData, UserRemoved, Users } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';


@Resolver(() => User)

export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // @Mutation(() => User)
  // createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
  //   return this.userService.create(createUserInput);
  // }

  // // @Query(() => [User], { name: 'user' })
  // // @Query(() => [User])
  // @Query(() => Users)
  // getUsers() {
  //   return this.userService.findAll()
  // }

  // @Query(() => [User], {name: 'SingleUser'})
  // findOne(@Args('id', { type: () => Int! }) id: number) {
  //   return this.userService.findOne(id);
  // }

  // @Mutation(() => User,{name: 'UpdateUser'})
  // updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
  //   return this.userService.update(updateUserInput.id, updateUserInput);
  // }

  // @Mutation(() => UserRemoved, {name: 'RemoveUser'})
  // removeUser(@Args('id', { type: () => Int }) id: number) {
  //   return this.userService.remove(id);
  // }


  @Query(() => UserData,{name: 'allUsers'})
  allUsersFake() {
    return this.userService.findAllFakeUsers()
  }

  @Query(() => User, {name: 'SingleUserFake'})
  singleUser(@Args('id',{type: () => ID}) id: string) {
    return this.userService.findSingleUser(id)
  }
}
