import { CreateDeviceDto } from '@app/common/dto/create-device.dto';

type Status = 'init' | 'flashed' | 'aborted';

export interface NewDeviceData {
  status: Status;
  device: CreateDeviceDto;
  metadata?: {
    ssid: string;
    pass: string;
  };
  clientId?: string;
}
