import { VendorDeviceI } from './vendor-device.interface';

export interface VendorI {
  name: string;
  slug: string;
  devices: VendorDeviceI[];
}
