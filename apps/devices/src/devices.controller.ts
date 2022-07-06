import {
  Command,
  SensorMessage,
  IncomingStateMsg,
  Vendor,
  StateMsg,
  DeviceElements,
  NewDeviceData,
  NewDeviceId,
  CreateDeviceDto,
  UpdateWiFiDto,
  Period,
  DeviceElementData,
} from '@app/common';
import { ackErrorHandler, RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { firstValueFrom } from 'rxjs';
import { DevicesService } from './devices.service';
import { ObserversService } from './observers.service';
import { Device } from './schemas/device.schema';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService, private readonly observersService: ObserversService) {}

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async devicesHanlder({ pattern }: { pattern: string }): Promise<Vendor[] | Device[] | DeviceElements[]> {
    switch (pattern) {
      case 'vendors-list':
        return this.devicesService.vendorsList();

      case 'devices':
        return this.devicesService.getDevices();

      case 'devices-elements':
        return this.devicesService.getDevicesElements();
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-new',
    allowNonJsonMessages: true,
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async addDeviceHandler({
    pattern,
    data,
  }: {
    pattern: NewDeviceData['status'];
    data: NewDeviceData;
  }): Promise<NewDeviceId | string> {
    switch (pattern) {
      case 'init':
        return this.devicesService.addDevice(data);

      case 'flashed':
        return this.devicesService.confirmNewDevice(data);

      case 'aborted':
        return this.devicesService.abortNewDevice(data);
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-update',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async devicesUpdateHandler({
    pattern,
    data,
  }: {
    pattern: 'update-device' | 'update-device-wifi';
    data: { id: string; device?: CreateDeviceDto; wifi?: UpdateWiFiDto };
  }): Promise<Device | string> {
    if (pattern === 'update-device') {
      return this.devicesService.updateDevice(data.id, data.device as CreateDeviceDto);
    } else {
      const cmd = Object.entries(data.wifi)
        .map(([key, val]) => `${key} ${val}`)
        .join('; ');

      await this.devicesService.execCommand('backlog', cmd, data.id);
      return 'ok';
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-cmd',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async devicesCmdHandler({ data }: { data: Command }): Promise<string> {
    const cmdValue = typeof data.value === 'string' ? data.value : String(data.value);

    await this.devicesService.execCommand(data.name, cmdValue, data.topicId);
    return 'ok';
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-add-remove-observer',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
    allowNonJsonMessages: true,
  })
  async addObserver({ pattern, data }: { pattern: 'add' | 'remove'; data: string }) {
    switch (pattern) {
      case 'add':
        this.observersService.addObserver(data);
        break;

      case 'remove':
        this.observersService.removeObserver(data);
        break;
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-remove',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
    allowNonJsonMessages: true,
  })
  async removeDeviceHandler({ data }: { data: string }): Promise<string> {
    return this.devicesService.removeDevice(data);
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-element',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
    allowNonJsonMessages: true,
    errorHandler: ackErrorHandler,
  })
  async devicesElementHandler({
    pattern,
    data,
  }: {
    pattern: string;
    data: { id: string; element: string; period?: Period; timezone?: string };
  }): Promise<string | number | DeviceElementData[]> {
    const device = await this.devicesService.getDevice(data.id);

    switch (pattern) {
      case 'device-element-data':
        return this.devicesService.getElementData(data.id, data.element, data.period, data.timezone);

      case 'device-element':
        if (device && device.online && device.elements.find((item) => item.name === data.element)) {
          const res = await this.devicesService.listenElement(device._id, device.gpio, data.element);
          await this.devicesService.execCommand('Status', '8', device._id);

          return firstValueFrom(res);
        } else return 'error';
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'devices-wifi',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
    allowNonJsonMessages: true,
    errorHandler: ackErrorHandler,
  })
  async devicesWiFiHandler({ data }: { data: string }): Promise<any> {
    const res = await this.devicesService.listenWiFi(data);
    await this.devicesService.execCommand('Ssid', '', data);

    return firstValueFrom(res);
  }

  @RabbitSubscribe({
    exchange: 'amq.topic',
    routingKey: 'tele.#.LWT',
    queue: 'devices-online',
    createQueueIfNotExists: true,
    allowNonJsonMessages: true,
  })
  async devicesOnlineHandler(msg: object, rawMessage: ConsumeMessage) {
    const deviceTopic = rawMessage.fields.routingKey.split('.')[1];
    const content = rawMessage.content.toString();

    const status = content === 'Online' ? true : false;
    const handledMsg = this.devicesService.handleOnline(status);

    await this.devicesService.setDeviceStatus(deviceTopic, status);

    if (this.observersService.observersExist()) {
      this.observersService.sendToObservers(deviceTopic, JSON.stringify(handledMsg));
    }
  }

  @RabbitSubscribe({
    exchange: 'amq.topic',
    routingKey: 'tele.#.SENSOR',
    queue: 'devices-sensors',
    allowNonJsonMessages: true,
  })
  async sensorsHandler(msg: SensorMessage, rawMessage: ConsumeMessage) {
    const deviceTopic = rawMessage.fields.routingKey.split('.')[1];
    const deviceInterval = this.devicesService.getSensorInterval(deviceTopic);

    if (deviceInterval && deviceInterval.ready) {
      await this.devicesService.saveDataMessage(msg, deviceTopic, deviceInterval.gpio);
      deviceInterval.ready = false;
    }

    if (this.observersService.observersExist()) {
      const handledMsg = this.devicesService.handleSensorElements(msg, deviceInterval.gpio);
      this.observersService.sendToObservers(deviceTopic, JSON.stringify(handledMsg));
    }
  }

  @RabbitSubscribe({
    exchange: 'amq.topic',
    routingKey: 'tele.#.STATE',
    queue: 'devices-results',
    allowNonJsonMessages: true,
  })
  async handleDeviceResults(msg: IncomingStateMsg, rawMessage: ConsumeMessage) {
    const deviceTopic = rawMessage.fields.routingKey.split('.')[1];

    let state: Partial<StateMsg> = {
      Color: '',
      Dimmer: 0,
      POWER: '',
    };

    state = Object.fromEntries(Object.entries(msg).filter(([key]) => Object.keys(state).includes(key)));

    if (Object.keys(state).length) {
      await this.devicesService.saveMessage(state, deviceTopic);

      if (this.observersService.observersExist()) {
        const handledMsg = this.devicesService.handleSwitchElements(state);
        this.observersService.sendToObservers(deviceTopic, JSON.stringify(handledMsg));
      }
    }
  }
}
