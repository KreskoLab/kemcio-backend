import { CreateUserDto, LoginUserDto } from '@app/common';
import { Controller, UseFilters } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MongoExceptionFilter } from './mongo-exception.filter';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'user-login' })
  async login(@Payload() data: LoginUserDto, @Ctx() context: RmqContext): Promise<User> {
    return this.usersService.login(data);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'user-registration' })
  async registration(@Payload() data: CreateUserDto, @Ctx() context: RmqContext): Promise<User> {
    return this.usersService.registration(data);
  }

  @UseFilters(new MongoExceptionFilter())
  @MessagePattern({ cmd: 'user-data' })
  async userData(@Payload() id: string, @Ctx() context: RmqContext): Promise<User> {
    return this.usersService.getById(id);
  }
}
