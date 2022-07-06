import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  MessageEvent,
  Param,
  Post,
  Put,
  Query,
  Res,
  Sse,
  StreamableFile,
} from '@nestjs/common';
import { CommandDto, CreateDeviceDto, DeviceElements, Period, UpdateWiFiDto, Vendor } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device } from 'apps/devices/src/schemas/device.schema';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { firstValueFrom, Observable } from 'rxjs';
import { SseService } from '../sse.service';
import { v4 as uuid } from 'uuid';

@Controller('devices')
export class DevicesController {
  constructor(
    @Inject('devices') private readonly devicesService: ClientProxy,
    @Inject('devices-new') private readonly devicesNewService: ClientProxy,
    @Inject('devices-cmd') private readonly devicesCmdService: ClientProxy,
    @Inject('devices-element') private readonly devicesElementService: ClientProxy,
    @Inject('devices-wifi') private readonly devicesWiFiService: ClientProxy,
    @Inject('devices-update') private readonly devicesUpdateService: ClientProxy,
    @Inject('devices-remove') private readonly devicesRemoveService: ClientProxy,
    private readonly sseService: SseService,
  ) {}

  @Get()
  async getDevices(): Promise<Device[]> {
    return firstValueFrom(this.devicesService.send('devices', ''));
  }

  @Get('vendors')
  async getVendors(): Promise<Vendor[]> {
    return firstValueFrom(this.devicesService.send('vendors-list', ''));
  }

  @Get('elements')
  async getComponents(): Promise<DeviceElements[]> {
    return firstValueFrom(this.devicesService.send('devices-elements', ''));
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

  @Sse('status')
  async deviceStatis(@Res() response: Response): Promise<Observable<MessageEvent>> {
    const observerId = uuid();

    response.socket.on('end', () => this.sseService.remove(observerId));

    this.sseService.add(observerId);
    return this.sseService.send();
  }

  @Get(':id/wifi')
  async getDeviceWifi(@Param('id') id: string): Promise<string> {
    return firstValueFrom(this.devicesWiFiService.send('device-wifi', id));
  }

  @Get(':id/data/:element')
  async getDeviceElementData(
    @Param('id') deviceId: string,
    @Param('element') deviceElement: string,
    @Query('period') period: Period = 'day',
    @Query('tz') tz?: string,
  ): Promise<any> {
    return firstValueFrom(
      this.devicesElementService.send('device-element-data', {
        id: deviceId,
        element: deviceElement,
        period: period,
        timezone: tz,
      }),
    );
  }

  @Get(':id/:element')
  async getDeviceElement(@Param('id') id: string, @Param('element') element: string): Promise<string> {
    const res = await firstValueFrom(this.devicesElementService.send('device-element', { id, element }));

    if (res !== 'error') return res;
    else throw new HttpException('Element not found', HttpStatus.NOT_FOUND);
  }

  @Post(':id/command')
  async deviceCommand(@Param('id') topicId: string, @Body() cmd: CommandDto): Promise<string> {
    return firstValueFrom(this.devicesCmdService.send('device-cmd', { ...cmd, topicId }));
  }

  @Post()
  async createDevice(@Body() device: CreateDeviceDto): Promise<Device> {
    return firstValueFrom(this.devicesNewService.send('add-device', device));
  }

  @Put(':id/wifi')
  async updateDeviceWiFi(@Param('id') id: string, @Body() wifiDto: UpdateWiFiDto): Promise<string> {
    return firstValueFrom(this.devicesUpdateService.send('update-device-wifi', { id: id, wifi: wifiDto }));
  }

  @Put(':id')
  async updateDevice(@Param('id') id: string, @Body() dto: CreateDeviceDto): Promise<Device> {
    return firstValueFrom(this.devicesUpdateService.send('update-device', { id: id, device: dto }));
  }

  @Delete(':id')
  async removeDevice(@Param('id') id: string): Promise<string> {
    return firstValueFrom(this.devicesRemoveService.send('remove-device', id));
  }
}
