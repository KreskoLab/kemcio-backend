export type StateMsg = Pick<IncomingStateMsg, 'POWER' | 'Color' | 'Dimmer'>;

export interface IncomingStateMsg {
  Time: string;
  Uptime: string;
  UptimeSec: number;
  Heap: number;
  SleepMode: string;
  Sleep: number;
  LoadAvg: number;
  MqttCount: number;
  POWER: string;
  Dimmer: number;
  Color: string;
  HSBColor: string;
  White: number;
  CT: number;
  Channel: number[];
  Scheme: number;
  Fade: string;
  Speed: number;
  LedTable: string;
  Wifi: {
    AP: number;
    SSId: string;
    BSSId: string;
    Channel: number;
    Mode: string;
    RSSI: number;
    Signal: number;
    LinkCount: number;
    Downtime: string;
  };
}
