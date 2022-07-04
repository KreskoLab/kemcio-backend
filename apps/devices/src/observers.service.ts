import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ObserverMessage } from '@app/common';

@Injectable()
export class ObserversService {
  constructor(private readonly amqpService: AmqpConnection) {}

  private observers: string[] = [];

  public addObserver(id: string): void {
    this.observers.push(id);
  }

  public removeObserver(id: string): void {
    this.observers = this.observers.filter((observer) => observer !== id);
  }

  public observersExist(): boolean {
    return this.observers.length ? true : false;
  }

  public sendToObservers(topic: string, msg: string): void {
    this.sendMessage({ data: msg, id: topic });
  }

  private sendMessage(msg: ObserverMessage): void {
    const content = Buffer.from(JSON.stringify(msg));
    this.amqpService.channel.sendToQueue('devices-observers', content);
  }
}
