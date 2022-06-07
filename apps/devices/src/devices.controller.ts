import { CreateDeviceDto, SseTopicI, VendorI } from '@app/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { DevicesService } from './devices.service';
import { Device } from './schemas/device.schema';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async rpcHandler({
    pattern,
    data,
  }: {
    pattern: string;
    data: string & CreateDeviceDto;
  }): Promise<VendorI[] | Device> {
    switch (pattern) {
      case 'vendors-list':
        return this.devicesService.vendorsList();

      case 'add-device':
        return this.devicesService.addDevice(data);
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-add-observer',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async addObserver({ data }: { data: SseTopicI }) {
    this.devicesService.sseTopics.push(data);
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-remove-observer',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async remvoeObserver({ data }: { data: string }) {
    this.devicesService.removeObserver(data);
  }

  @RabbitSubscribe({
    exchange: 'amq.topic',
    routingKey: 'tele.*.LWT',
    queue: 'devices-online',
    createQueueIfNotExists: true,
    allowNonJsonMessages: true,
    queueOptions: {
      autoDelete: true,
    },
  })
  async pubSubHandler(msg: object, rawMessage: ConsumeMessage) {
    const deviceTopic = rawMessage.fields.routingKey.split('.')[1];
    const content = rawMessage.content.toString();

    const status = content === 'Online' ? true : false;

    try {
      await this.devicesService.setDeviceStatus(deviceTopic, status);
    } catch (error) {
      console.log(error);
    }
  }

  @RabbitSubscribe({
    exchange: 'amq.topic',
    routingKey: 'stat.*.RESULT',
    queue: 'devices-status',
    allowNonJsonMessages: true,
    queueOptions: {
      autoDelete: true,
    },
  })
  async competingPubSubHandler(msg: {}, rawMessage: ConsumeMessage) {
    const deviceTopic = rawMessage.fields.routingKey.split('.')[1];

    await this.devicesService.saveMessage(msg, deviceTopic);

    if (this.devicesService.sseTopicExist(deviceTopic)) {
      this.devicesService.sendToObservers(deviceTopic, JSON.stringify(msg));
    }
  }
}
