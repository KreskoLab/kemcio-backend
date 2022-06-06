import { CreateDeviceDto, VendorI } from '@app/common';
import { Body, Controller, Get, Inject, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device } from 'apps/devices/src/schemas/device.schema';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { firstValueFrom } from 'rxjs';

@Controller('devices')
export class DevicesController {
  constructor(@Inject('devices') private readonly devicesService: ClientProxy) {}

  @Get('vendors')
  async getVendors(): Promise<VendorI[]> {
    return firstValueFrom(this.devicesService.send('vendors-list', ''));
  }

  @Get('firmware')
  async getFirmware(@Query('device') device: string, @Res({ passthrough: true }) res: Response) {
    const path = resolve(__dirname, 'firmwares', `${device}.bin`);
    const firmware = createReadStream(path);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=' + `${device}.bin`,
    });

    return new StreamableFile(firmware);
  }

  @Post()
  async createDevice(@Body() device: CreateDeviceDto): Promise<Device> {
    return firstValueFrom(this.devicesService.send('add-device', device));
  }
}
