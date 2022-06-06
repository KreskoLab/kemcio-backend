import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@app/common';
import { UsersRepository } from './users.repository';
import { LoginUserDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async login(loginUserDto: LoginUserDto): Promise<User> {
    const user = await this.userRepository.findByLogin(loginUserDto.login);

    if (!user) {
      throw new RpcException({ code: 404, msg: 'User not found' });
    } else {
      const passwordMatch = await this.comparePassword(loginUserDto.password, user.password);

      if (passwordMatch) {
        return user;
      } else {
        throw new RpcException({ code: 401, msg: 'Inccorect login or password' });
      }
    }
  }

  async registration(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.create({ ...createUserDto, password: await this.hashPassword(createUserDto.password) });
  }

  async getById(userId: string): Promise<User> {
    return this.userRepository.findById(userId);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(requestPassword: string, password: string): Promise<boolean> {
    return bcrypt.compare(requestPassword, password);
  }
}
