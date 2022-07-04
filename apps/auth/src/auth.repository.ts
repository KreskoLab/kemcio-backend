import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Token, TokenDocument } from './schemas/token.schema';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(Token.name) private tokenModel: Model<TokenDocument>) {}

  async updateOrCreate(token: Token): Promise<Token> {
    return this.tokenModel.create({ tokenId: token.tokenId, createdAt: token.createdAt });
  }

  async findByTokenId(id: string): Promise<Token> {
    return this.tokenModel.findOne({ tokenId: id });
  }
}
