import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DataDocument = Data & Document;

@Schema({ timeseries: { metaField: 'topicId', timeField: 'time' }, versionKey: false })
export class Data {
  _id: string;

  @Prop({ type: Object })
  data: object;

  @Prop()
  topicId: string;

  @Prop()
  time: Date;
}

export const DataSchema = SchemaFactory.createForClass(Data);
