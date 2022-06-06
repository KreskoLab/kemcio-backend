import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Token, TokenDocument } from './schemas/token.schema';
import { TokenI } from '@app/common/interfaces/token.interface';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(Token.name) private tokenModel: Model<TokenDocument>) {}

  async updateOrCreate(token: TokenI): Promise<Token> {
    return this.tokenModel.findOneAndUpdate({ tokenId: token.tokenId }, { $set: token }, { upsert: true });
  }

  async findByTokenId(id: string): Promise<Token> {
    return this.tokenModel.findOne({ tokenId: id });
  }

  async remove(tokenId: string): Promise<void> {
    this.tokenModel.findByIdAndRemove(tokenId);
  }
}
