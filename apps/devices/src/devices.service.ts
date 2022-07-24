import {
  MessageData,
  SensorInterval,
  SensorMessage,
  Vendor,
  DataI,
  NAMES,
  UNITS,
  StateMsg,
  DeviceElements,
  ELEMENTS,
  NewDeviceData,
  NewDeviceId,
  CreateDeviceDto,
  WiFi,
  Period,
  DeviceElementData,
} from '@app/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import { DataRepository } from './repositories/data.repository';
import { DeviceRepository } from './repositories/device.repository';
import { Device, DeviceDocument } from './schemas/device.schema';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';

@Injectable()
export class DevicesService {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly dataRepository: DataRepository,
    private readonly amqpService: AmqpConnection,
    private readonly configService: ConfigService,
  ) {}

  private sensorsIntervals: SensorInterval[] = [];
  private pendingNewDevices = new Map<string, DeviceDocument>();

  async onModuleInit() {
    await this.setSensorsIntervals();
  }

  public async vendorsList(): Promise<Vendor[]> {
    const path = resolve(__dirname, 'data', 'vendors.json');
    const vendors: Vendor[] = await fs.readFile(path, 'utf-8').then((res) => JSON.parse(res));

    return vendors.filter((vendor) => vendor.devices.length);
  }

  public async getVendorDeviceGpio(name: string): Promise<string> {
    const devices = await this.vendorsList().then((res) => res.map((vendor) => vendor.devices).flat());
    return devices.find((device) => device.name == name).gpio;
  }

  public async addDevice(data: NewDeviceData): Promise<NewDeviceId> {
    if (!this.pendingNewDevices.has(data.clientId)) {
      const device = await this.deviceRepository.create(data.device);

      this.pendingNewDevices.set(data.clientId, device);

      const flashCmd = `Backlog WebServer 0; Topic ${device._id}; SSID1 ${data.metadata.ssid}; Password1 ${data.metadata.pass}; SetOption65 1; SetOption1 1;`;
      const mqttHost = `MqttHost ${this.configService.get('MQTT_HOST')};`;
      const mqttPort = `MqttPort ${this.configService.get('MQTT_PORT')};`;
      const mqttUser = `MqttUser ${this.configService.get('MQTT_USER')};`;
      const mqttPass = `MqttPassword ${this.configService.get('MQTT_PASSWORD')};`;

      const mqttCmd = mqttHost + mqttPort + mqttUser + mqttPass;

      if (data.device.type === 'sensor') {
        const sensorCmd = `${data.device.pin} ${data.device.gpio}; TelePeriod 10\n`;
        return { deviceId: device._id, cmd: flashCmd + mqttCmd + sensorCmd };
      } else {
        return { deviceId: device._id, cmd: flashCmd + mqttCmd + '\n' };
      }
    }
  }

  public async abortNewDevice(data: Pick<NewDeviceData, 'clientId'>): Promise<string> {
    const device = this.pendingNewDevices.get(data.clientId);

    if (device) {
      this.pendingNewDevices.delete(data.clientId);
    }

    return 'aborted';
  }

  public async confirmNewDevice(data: Pick<NewDeviceData, 'clientId'>): Promise<string> {
    const device = this.pendingNewDevices.get(data.clientId);

    if (device) {
      await this.deviceRepository.save(device);

      if (device.type === 'sensor') {
        this.sensorsIntervals.push(new SensorInterval(device.interval, String(device._id), device.gpio));
      }

      this.pendingNewDevices.delete(data.clientId);
    }

    return 'added';
  }

  public async getDevice(id: string): Promise<Device> {
    return this.deviceRepository.findById(id);
  }

  public async updateDevice(id: string, deviceDto: CreateDeviceDto): Promise<Device> {
    const newDeviceProperties = Object.entries(deviceDto).filter(([_, val]) => val !== undefined);
    const newDevice = Object.fromEntries(newDeviceProperties) as Device;

    if (newDevice.pin && newDevice.interval) {
      const { device } = await this.deviceRepository.findById(id);
      const gpio = await this.getVendorDeviceGpio(device);

      await this.execCommand(newDevice.pin, gpio, id);
      this.resetSensorInterval(id, newDevice.interval, gpio);
    }

    return this.deviceRepository.updateById(id, newDevice);
  }

  public async setDeviceStatus(deviceTopic: string, status: boolean): Promise<Device> {
    return this.deviceRepository.updateProperty(deviceTopic, 'online', status);
  }

  public async removeDevice(id: string): Promise<string> {
    const device = await this.deviceRepository.findById(id);

    await this.execCommand('Reset', '1', id);

    switch (device.type) {
      case 'switch':
      case 'bulb':
        await this.deviceRepository.removeById(id);
        break;

      case 'sensor':
        await this.deviceRepository.removeById(id);
        await this.dataRepository.remove(id);
        break;
    }

    return 'ok';
  }

  public async getDevicesElements(): Promise<DeviceElements[]> {
    const elements = await this.deviceRepository.getElements();
    elements.forEach((element, i, arr) => (arr[i] = { ...element, name: NAMES[element.name] }));

    return elements;
  }

  public async getDevices(): Promise<Device[]> {
    const list = await this.deviceRepository.getAll();

    list.forEach(
      (_, i, arr) =>
        (arr[i].elements = arr[i].elements.map((element) => ({
          element: element.name,
          name: NAMES[element.name],
          value: UNITS[element.name] ? element.value + UNITS[element.name] : element.value,
        }))),
    );

    return list;
  }

  public async getElementData(
    deviceId: string,
    element: string,
    period: Period,
    timezone: string,
  ): Promise<DeviceElementData[]> {
    const tz = timezone ? timezone : DateTime.local().zoneName;
    return this.dataRepository.getData(deviceId, element, period, tz);
  }

  public handleOnline(msg: boolean) {
    return { online: msg };
  }

  public handleSwitchElements(msg: Partial<StateMsg>) {
    const messages: MessageData[] = [];
    Object.entries(msg).forEach(([key, val]) => messages.push({ element: key, name: NAMES[key], value: val }));

    return messages;
  }

  public handleSensorElements(msg: SensorMessage, gpio: string) {
    let message: MessageData[] = [];

    switch (gpio) {
      case '1184':
        message = [
          {
            name: NAMES.TEMPERATURE,
            value: msg.DHT11.Temperature + UNITS.TEMPERATURE,
            element: ELEMENTS.TEMPERATURE,
          },
          { name: NAMES.HUMIDITY, value: msg.DHT11.Humidity + UNITS.HUMIDITY, element: ELEMENTS.HUMIDITY },
        ];

        break;
    }

    return message;
  }

  public async saveMessage(msg: Partial<StateMsg>, deviceTopic: string): Promise<void> {
    const messages: MessageData[] = [];
    Object.entries(msg).forEach(([key, val]) => messages.push({ name: key, value: val }));

    await this.deviceRepository.replaceMesage(deviceTopic, messages);
  }

  public async saveDataMessage(msg: SensorMessage, deviceTopic: string, gpio: string): Promise<void> {
    let data: Partial<DataI>;
    let lastMessage: MessageData[] = [];

    switch (gpio) {
      case '1184':
        data = { temperature: msg.DHT11.Temperature, humidity: msg.DHT11.Temperature };

        lastMessage = [
          { name: 'TEMPERATURE', value: msg.DHT11.Temperature },
          { name: 'HUMIDITY', value: msg.DHT11.Humidity },
        ];

        break;
    }

    const UTC = DateTime.fromISO(msg.Time, { zone: 'Europe/London' }).toUTC().toString();

    await this.deviceRepository.replaceMesage(deviceTopic, lastMessage);
    await this.dataRepository.save({ time: UTC, topicId: deviceTopic, data: data });
  }

  async execCommand(cmd: string, value: string, deviceTopic: string): Promise<void> {
    this.amqpService.publish('amq.topic', `cmnd.${deviceTopic}.${cmd}`, Buffer.from(value));
  }

  public async listenElement(topicId: string, gpio: string, element: string): Promise<Observable<string | number>> {
    interface ElementMsg {
      StatusSNS: SensorMessage;
    }

    const { queue, consumerTag } = await this.newQueue('amq.topic', `stat.${topicId}.STATUS8`);

    return new Observable((observer) => {
      this.amqpService.channel.consume(
        queue,
        (rawMsg) => {
          const msg: ElementMsg = JSON.parse(rawMsg.content.toString());
          const handledMsg = this.handleSensorElements(msg.StatusSNS, gpio);
          const key = NAMES[element];

          observer.next(handledMsg.find((item) => item.name === key).value);
          observer.complete();

          this.amqpService.channel.cancel(consumerTag);
        },
        { consumerTag: consumerTag },
      );
    });
  }

  public async listenWiFi(topicId: string): Promise<Observable<WiFi>> {
    const { queue, consumerTag } = await this.newQueue('amq.topic', `stat.${topicId}.RESULT`);

    return new Observable((observer) => {
      setTimeout(async () => {
        observer.next({ SSId1: '' });
        observer.complete();
        this.amqpService.channel.cancel(consumerTag);
      }, 10000);

      this.amqpService.channel.consume(
        queue,
        (rawMsg) => {
          observer.next(JSON.parse(rawMsg.content.toString()));
          observer.complete();

          this.amqpService.channel.cancel(consumerTag);
        },
        { consumerTag: consumerTag },
      );
    });
  }

  public getSensorInterval(id: string): SensorInterval {
    return this.sensorsIntervals.find((interval) => interval.id === id);
  }

  public resetSensorInterval(id: string, interval: number, gpio: string): void {
    this.sensorsIntervals = this.sensorsIntervals.filter((item) => item.id !== id);
    this.sensorsIntervals.push(new SensorInterval(interval, String(id), gpio));
  }

  private async setSensorsIntervals() {
    const devices = await this.deviceRepository.getAll();

    this.sensorsIntervals = devices
      .filter((device) => device.type === 'sensor')
      .map((item) => new SensorInterval(item.interval, String(item._id), item.gpio));
  }

  private async newQueue(exchange: string, pattern: string) {
    const queue = uuidv4();
    const consumerTag = uuidv4();

    await this.amqpService.channel.assertQueue(queue, { autoDelete: true, durable: false });
    await this.amqpService.channel.bindQueue(queue, exchange, pattern);

    return { queue, consumerTag };
  }
}
