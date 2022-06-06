import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({ versionKey: false })
export class Token {
  _id: string;

  @Prop({ required: true, unique: true })
  tokenId: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
