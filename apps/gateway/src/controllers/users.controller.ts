import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseFilters } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { User } from '@app/common/interfaces/user.interface';
import { AllExceptionsFilter } from '../rpc-exception.filter';
import { CreateUserDto, UpdateUserDto } from '@app/common';

@Controller('users')
export class UsersController {
  constructor(@Inject('users') private readonly userService: ClientProxy) {}

  @Get()
  @UseFilters(new AllExceptionsFilter())
  async getUsers(): Promise<User[]> {
    return firstValueFrom<User[]>(this.userService.send({ cmd: 'users' }, ''));
  }

  @Post()
  @UseFilters(new AllExceptionsFilter())
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return firstValueFrom(this.userService.send({ cmd: 'user-add' }, dto));
  }

  @Put(':id')
  @UseFilters(new AllExceptionsFilter())
  async updateUser(@Param('id') userId: string, @Body() updateDto: UpdateUserDto): Promise<User> {
    return firstValueFrom<User>(this.userService.send({ cmd: 'user-update' }, { id: userId, dto: updateDto }));
  }

  @Delete(':id')
  @UseFilters(new AllExceptionsFilter())
  async removeUser(@Param('id') userId: string): Promise<User> {
    return firstValueFrom<User>(this.userService.send({ cmd: 'user-remove' }, { id: userId }));
  }
}
