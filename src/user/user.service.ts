import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

const db = [
  {
    name: 'Mohamed',
    email: 'mohamed@gmail.com',
    password: '123456',
    id: 1
  },
  {
    name: 'John Doe',
    email: 'john@doe.com',
    password: '123456',
    id: 2
  }
]

@Injectable()
export class UserService {
  create(createUserInput: CreateUserInput) {
    const newUser = {...createUserInput, id: db.length + 1}
    db.push(newUser)
    return newUser
  }

  findAll() {
    return {
      status: 200,
      data: db,
      count: db.length
    }
  }

  findOne(id: number) {
    const user = db.filter((user) => user.id === id)
    console.log(user)
    if(!user) throw new BadRequestException("User not found")
    return user
  }

  update(id: number, updateUserInput: UpdateUserInput) {
    return db.map((user) => user.id === id ? {...user, ...updateUserInput} : user)
  }

  remove(id: number) {

    const userDeleted = db.filter((user) => user.id !== id) 

    if(userDeleted.length === db.length) throw new BadRequestException("User not found")

    return {
      status: 200,
      message: "User deleted successfully",
    }
  }
}
