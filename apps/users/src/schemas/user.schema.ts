import { ROLES } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: string;

  @Prop({ required: true, minlength: 1, maxlength: 120 })
  name: string;

  @Prop({
    required: true,
    unique: true,
    minlength: 1,
    maxlength: 64,
  })
  login: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: ROLES, default: ROLES.GUEST })
  role: ROLES;
}

export const UserSchema = SchemaFactory.createForClass(User);
