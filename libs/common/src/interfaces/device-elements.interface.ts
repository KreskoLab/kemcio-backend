import { Device } from 'apps/devices/src/schemas/device.schema';

export interface DeviceElements {
  devices: Pick<Device, 'name' | '_id'>[];
  name: string;
  element: string;
}
