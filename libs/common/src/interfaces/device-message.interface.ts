import { MessageDataI } from './message-data.interface';

export interface DeviceMessageI {
  timestamp: number;
  data: MessageDataI[];
}
