import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GPIO, MessageData } from '@app/common';

export type DeviceDocument = Device & Document;

@Schema({ versionKey: false, timestamps: true })
export class Device {
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  vendor: string;

  @Prop({ required: true })
  device: string;

  @Prop({ required: false, type: String, enum: GPIO })
  gpio: GPIO;

  @Prop({ required: false })
  pin: string;

  @Prop({ required: false })
  online: boolean;

  @Prop({ required: false })
  interval: number;

  @Prop({ type: [] })
  elements: MessageData[];
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
