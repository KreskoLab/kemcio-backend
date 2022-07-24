import { GPIO } from '../enums/gpio';

interface VendorDevice {
  name: string;
  slug: string;
  vendor: string;
  type: string;
  gpio?: GPIO;
}

export interface Vendor {
  name: string;
  slug: string;
  devices: VendorDevice[];
}
