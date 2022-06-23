import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ObserverI, ObserverMessageI } from '@app/common';

@Injectable()
export class ObserversService {
  constructor(private readonly amqpService: AmqpConnection) {}

  private observables: ObserverI[] = [];

  public addObserver(observer: ObserverI): void {
    this.observables.push(observer);
  }

  public removeObserver(id: string): void {
    this.observables = this.observables.filter((observer) => observer.id !== id);
  }

  public observerTopicExist(topic: string): boolean {
    return !!this.observables.find((observer) => observer.topic === topic);
  }

  public sendToObservers(topic: string, msg: string): void {
    const observables = this.observables.filter((observer) => observer.topic === topic);
    observables.forEach((observer) => this.sendMessage({ data: msg, id: observer.id }));
  }

  private sendMessage(msg: ObserverMessageI): void {
    const content = Buffer.from(JSON.stringify(msg));
    this.amqpService.channel.sendToQueue('devices-observers', content);
  }
}
