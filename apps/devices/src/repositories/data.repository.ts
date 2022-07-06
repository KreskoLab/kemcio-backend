import { CreateDataDto, DeviceElementData, Period } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Data, DataDocument } from '../schemas/data.schema';

@Injectable()
export class DataRepository {
  constructor(@InjectModel(Data.name) private dataModel: Model<DataDocument>) {}

  async save(newData: CreateDataDto): Promise<Data> {
    return this.dataModel.create(newData);
  }

  async remove(id: string): Promise<void> {
    await this.dataModel.deleteMany({ topicId: id });
  }

  async getData(deviceId: string, element: string, period: Period, tz: string): Promise<DeviceElementData[]> {
    const pipeline: PipelineStage[] = [
      {
        $sort: { time: -1 },
      },
      {
        $set: {
          currentTime: '$$NOW',
        },
      },
    ];

    switch (period) {
      case 'day':
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                { topicId: deviceId },
                {
                  $eq: [
                    { $dateTrunc: { date: '$currentTime', unit: 'day', timezone: tz } },
                    { $dateTrunc: { date: '$time', unit: 'day', timezone: tz } },
                  ],
                },
              ],
            },
          },
        });

        pipeline.push({
          $group: {
            _id: {
              $dateTrunc: {
                date: '$time',
                unit: 'hour',
                timezone: tz,
              },
            },
            value: {
              $avg: `$data.${element}`,
            },
          },
        });

        break;

      case 'week':
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                { topicId: deviceId },
                {
                  $eq: [
                    { $dateTrunc: { date: '$currentTime', unit: 'week', timezone: tz } },
                    { $dateTrunc: { date: '$time', unit: 'week', timezone: tz } },
                  ],
                },
              ],
            },
          },
        });

        pipeline.push({
          $group: {
            _id: {
              $dateTrunc: {
                date: '$time',
                unit: 'day',
                timezone: tz,
              },
            },
            value: {
              $avg: `$data.${element}`,
            },
          },
        });

        break;

      case 'month':
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                { topicId: deviceId },
                {
                  $eq: [
                    { $dateTrunc: { date: '$currentTime', unit: 'month', timezone: tz } },
                    { $dateTrunc: { date: '$time', unit: 'month', timezone: tz } },
                  ],
                },
              ],
            },
          },
        });

        pipeline.push({
          $group: {
            _id: {
              $dateTrunc: {
                date: '$time',
                unit: 'day',
                timezone: tz,
              },
            },
            value: {
              $avg: `$data.${element}`,
            },
          },
        });

        break;
    }

    pipeline.push(
      {
        $set: {
          date: '$_id',
          value: { $round: ['$value', 1] },
          _id: '$$REMOVE',
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    );

    return this.dataModel.aggregate(pipeline);
  }
}
