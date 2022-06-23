import { CreateDeviceDto, DeviceElements, MessageDataI } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';

@Injectable()
export class DeviceRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>) {}

  async create(newDevice: CreateDeviceDto): Promise<Device> {
    return this.deviceModel.create(newDevice);
  }

  async findByTopic(deviceTopic: string): Promise<Device> {
    return this.deviceModel.findOne({ topic: deviceTopic });
  }

  async findById(deviceId: string): Promise<Device> {
    return this.deviceModel.findById(deviceId);
  }

  async getAll(): Promise<Device[]> {
    return this.deviceModel.find();
  }

  async updateProperty(deviceTopic: string, property: string, newValue: string | number | boolean): Promise<Device> {
    return this.deviceModel.findOneAndUpdate({ topic: deviceTopic }, { [property]: newValue }, { new: true });
  }

  async getElements(): Promise<DeviceElements[]> {
    return this.deviceModel.aggregate([
      {
        $match: {
          $expr: { $gt: [{ $size: '$elements' }, 0] },
        },
      },
      {
        $unwind: '$elements',
      },
      {
        $group: {
          _id: '$elements.name',
          element: { $first: '$elements.name' },
          devices: { $push: { name: '$name', _id: '$_id' } },
        },
      },
      {
        $project: {
          name: '$_id',
          element: 1,
          devices: 1,
          _id: 0,
        },
      },
    ]);
  }

  async replaceMesage(deviceTopic: string, message: MessageDataI[]): Promise<void> {
    const bulkDocs = [];

    message.forEach((item) =>
      bulkDocs.push({
        updateOne: {
          filter: { topic: deviceTopic },
          update: [
            {
              $set: {
                elements: {
                  $reduce: {
                    input: '$elements',
                    initialValue: [item],
                    in: {
                      $concatArrays: [
                        '$$value',
                        {
                          $cond: [
                            {
                              $in: ['$$this.name', '$$value.name'],
                            },
                            [],
                            ['$$this'],
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      }),
    );

    this.deviceModel.bulkWrite(bulkDocs);
  }
}
