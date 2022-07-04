export class SensorInterval {
  public interval: number;
  public id: string;
  public gpio: string;
  public ready = true;

  constructor(interval: number, id: string, gpio: string) {
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
