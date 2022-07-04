interface VendorDevice {
  name: string;
  slug: string;
  vendor: string;
  type: string;
  gpio?: string;
}

export interface Vendor {
  name: string;
  slug: string;
  devices: VendorDevice[];
}
