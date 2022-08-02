import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketGateway, MessageBody, SubscribeMessage } from '@nestjs/websockets';
import { NewDeviceData, NewDeviceId } from '@app/common';
import { firstValueFrom } from 'rxjs';

@WebSocketGateway({ path: '/device' })
export class DevicesGateway {
  constructor(@Inject('devices-new') private readonly devicesNewService: ClientProxy) {}

  @SubscribeMessage('devices-new')
  async handleEvent(
    @MessageBody() data: NewDeviceData,
  ): Promise<(NewDeviceId & Pick<NewDeviceData, 'clientId'>) | string> {
    switch (data.status) {
      case 'init':
        const id = uuidv4();
        const msg: NewDeviceData = { ...data, clientId: id };

        const res = await firstValueFrom(this.devicesNewService.send<NewDeviceId, NewDeviceData>('init', msg));
        return { ...res, clientId: id };

      case 'flashed':
        return firstValueFrom(this.devicesNewService.send<string, NewDeviceData>('flashed', data));

      case 'aborted':
        return firstValueFrom(this.devicesNewService.send<string, NewDeviceData>('aborted', data));
    }
  }
}
