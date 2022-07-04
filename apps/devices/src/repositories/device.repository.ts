import { CreateDeviceDto, DeviceElements, MessageData } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../schemas/device.schema';

@Injectable()
export class DeviceRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>) {}

  async save(device: DeviceDocument) {
    return device.save();
  }

  async create(newDevice: CreateDeviceDto): Promise<DeviceDocument> {
    return new this.deviceModel(newDevice);
  }

  async findById(id: string): Promise<Device> {
    return this.deviceModel.findById(id);
  }

  async getAll(): Promise<Device[]> {
    return this.deviceModel.find();
  }

  async removeById(id: string): Promise<Device> {
    return this.deviceModel.findByIdAndRemove(id);
  }

  async updateById(id: string, device: Partial<Device>): Promise<Device> {
    return this.deviceModel.findByIdAndUpdate(id, device, { new: true });
  }

  async updateProperty(deviceTopic: string, property: string, newValue: string | number | boolean): Promise<Device> {
    return this.deviceModel.findByIdAndUpdate(deviceTopic, { [property]: newValue }, { new: true });
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

  async replaceMesage(deviceTopic: string, message: MessageData[]): Promise<void> {
    const bulkDocs = [];

    message.forEach((item) =>
      bulkDocs.push({
        updateOne: {
          filter: { _id: deviceTopic },
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
