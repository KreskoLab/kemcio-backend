export class CreateDeviceDto {
  name: string;
  type: 'switch' | 'bulb' | 'sensor';
  vendor: string;
  device?: string;
  gpio?: string;
  pin?: string;
  interval?: number;
}
