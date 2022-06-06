import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '@app/common';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<User> {
    return this.userModel.create(dto);
  }

  async save(user: User): Promise<User> {
    const updatedUser = new this.userModel(user);
    return updatedUser.save();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id, 'login name _id');
  }

  async findByLogin(login: string): Promise<User> {
    return this.userModel.findOne({ login: login }, 'password login name tokens _id');
  }
}
