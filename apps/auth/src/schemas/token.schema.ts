import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({
  timeseries: { timeField: 'createdAt', granularity: 'minutes' },
  expireAfterSeconds: 604800,
  versionKey: false,
})
export class Token {
  _id?: string;

  @Prop({ required: true, unique: true, index: true })
  tokenId: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
