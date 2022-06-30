import { CreateDataDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Data, DataDocument } from '../schemas/data.schema';

@Injectable()
export class DataRepository {
  constructor(@InjectModel(Data.name) private dataModel: Model<DataDocument>) {}

  async save(newData: CreateDataDto): Promise<Data> {
    return this.dataModel.create(newData);
  }
}
