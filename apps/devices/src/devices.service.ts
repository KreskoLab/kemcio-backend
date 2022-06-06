import { CreateDeviceDto, VendorI } from '@app/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { ConsumeMessage } from 'amqplib';
import { resolve } from 'path';
import { DeviceRepository } from './device.repository';
import { Device } from './schemas/device.schema';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  @RabbitSubscribe({
    exchange: 'amq.topic',
    routingKey: 'tele.*.LWT',
    queue: 'devices-status',
    createQueueIfNotExists: true,
    allowNonJsonMessages: true,
  })
  async pubSubHandler(msg: object, rawMessage: ConsumeMessage) {
    const deviceTopic = rawMessage.fields.routingKey.split('.')[1];
    const content = rawMessage.content.toString();

    const status = content === 'Online' ? true : false;

    try {
      await this.setDeviceStatus(deviceTopic, status);
    } catch (error) {
      console.log(error);
    }
  }

  async vendorsList(): Promise<VendorI[]> {
    const path = resolve(__dirname, 'data', 'vendors.json');
    const vendors: VendorI[] = await fs.readFile(path, 'utf-8').then((res) => JSON.parse(res));

    return vendors.filter((vendor) => vendor.devices.length);
  }

  async addDevice(device: CreateDeviceDto): Promise<Device> {
    return this.deviceRepository.create(device);
  }

  async setDeviceStatus(deviceTopic: string, status: boolean): Promise<Device> {
    return this.deviceRepository.updateProperty(deviceTopic, 'online', status);
  }
}
