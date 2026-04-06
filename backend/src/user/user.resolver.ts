import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User, UserData, UserRemoved, Users } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}


  @Query(() => UserData, { name: 'allUsers' })
  allUsersFake() {
    return this.userService.findAllFakeUsers();
  }

  @Query(() => User, { name: 'SingleUserFake' })
  singleUser(@Args('id', { type: () => ID }) id: string) {
    return this.userService.findSingleUser(id);
  }

  @Mutation(() => UserRemoved, { name: 'RemoveUser' })
  removeUser(@Args('id', { type: () => ID }) id: string) {
    return this.userService.removeFakeUser(id);
  }
}
