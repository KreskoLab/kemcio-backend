import { GPIO } from '../enums/gpio';

export class SensorInterval {
  public interval: number;
  public id: string;
  public gpio: GPIO;
  public ready = true;

  constructor(interval: number, id: string, gpio: GPIO) {
    this.interval = interval;
    this.id = id;
    this.gpio = gpio;

    this.startInterval();
  }

  private startInterval(): void {
    setInterval(() => {
      this.ready = true;
    }, this.interval);
  }
}
