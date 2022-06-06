import { CreateDeviceDto, VendorI } from '@app/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Device } from './schemas/device.schema';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @RabbitRPC({
    queue: 'devices',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  public async rpcHandler({
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

  async addDevice(device: CreateDeviceDto): Promise<Device> {
    return this.devicesService.addDevice(device);
  }
}
