import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema()
export class Device {
  _id: string;

  @Prop({ required: true, unique: true })
  topic: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  vendor: string;

  @Prop({ required: false })
  online: boolean;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
