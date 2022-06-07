import { CreateDeviceDto, DeviceMessageI, ObserverMessageI, SseTopicI, VendorI } from '@app/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { DeviceRepository } from './device.repository';
import { Device } from './schemas/device.schema';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceRepository: DeviceRepository, private readonly amqpService: AmqpConnection) {}

  sseTopics: SseTopicI[] = [];

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

  async saveMessage(msg: any, deviceTopic: string): Promise<any> {
    const device = await this.deviceRepository.findByTopic(deviceTopic);

    switch (device.type) {
      case 'switch':
        const newDeviceMsg: DeviceMessageI = {
          data: [
            {
              name: 'POWER',
              value: msg.POWER,
            },
          ],
          timestamp: new Date().getTime(),
        };

        await this.deviceRepository.replaceMesage(deviceTopic, newDeviceMsg);
        break;

      default:
        break;
    }
  }

  sseTopicExist(topic: string): boolean {
    return !!this.sseTopics.find((sse) => sse.topic === topic);
  }

  removeObserver(observerId: string): void {
    this.sseTopics = this.sseTopics.filter((sse) => sse.observerId !== observerId);
  }

  sendToObservers(topic: string, msg: string): void {
    const topics = this.sseTopics.filter((sse) => sse.topic === topic);
    topics.forEach((topic) => this.sendMessage({ data: msg, observerId: topic.observerId }));
  }

  private sendMessage(msg: ObserverMessageI): void {
    const stringify = JSON.stringify(msg);
    this.amqpService.channel.sendToQueue('devices-observers', Buffer.from(stringify));
  }
}
