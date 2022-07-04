import { CreateUserDto, LoginUserDto, UpdateUserDto } from '@app/common';
import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MongoExceptionFilter } from './mongo-exception.filter';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'user-login' })
  async login(@Payload() data: LoginUserDto): Promise<User> {
    return this.usersService.login(data);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'user-data' })
  async userData(@Payload() id: string): Promise<User> {
    return this.usersService.getById(id);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'user-update' })
  async update(@Payload() data: { id: string; dto: UpdateUserDto }): Promise<User> {
    return this.usersService.updateById(data.id, data.dto);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'user-remove' })
  async remove(@Payload() data: { id: string }): Promise<User> {
    return this.usersService.removeById(data.id);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'user-add' })
  async add(@Payload() data: CreateUserDto): Promise<User> {
    return this.usersService.create(data);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'users' })
  async getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }
}
