import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { DeviceRepository } from './device.repository';

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
      await this.deviceRepository.updateProperty(deviceTopic, 'online', status);
    } catch (error) {
      console.log(error);
    }
  }
}
