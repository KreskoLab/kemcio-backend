type DHT = {
  Temperature: number;
  Humidity: number;
};

export interface SensorMessage {
  Time: string;
  DHT11?: DHT;
  DHT22?: DHT;
}
