import { CreateDeviceDto } from '@app/common';
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

  async updateProperty(deviceTopic: string, property: string, newValue: string | number | boolean): Promise<Device> {
    return this.deviceModel.findOneAndUpdate({ topic: deviceTopic }, { [property]: newValue }, { new: true });
  }
}
