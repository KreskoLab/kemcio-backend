import { DEVICES_CMD, DEVICES_ROUTES, MessageData, ObserverMessage } from '@app/common';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, MessageEvent } from '@nestjs/common';
import { Device } from 'apps/devices/src/schemas/device.schema';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable()
export class EventsService {
  constructor(private readonly amqpService: AmqpConnection) {}

  private events: {
    id: string;
    subject: ReplaySubject<MessageEvent>;
    observer: Observable<MessageEvent>;
  }[] = [];

  public add(id: string): Observable<MessageEvent> {
    const subject = new ReplaySubject<MessageEvent>();
    const observer = subject.asObservable();

    this.events.push({ id, subject, observer });

    this.amqpService.channel.sendToQueue(
      DEVICES_ROUTES.OBSERVER,
      Buffer.from(JSON.stringify({ pattern: DEVICES_CMD.ADD, data: id })),
    );

    return observer;
  }

  public remove(id: string): void {
    this.amqpService.channel.sendToQueue(
      DEVICES_ROUTES.OBSERVER,
      Buffer.from(JSON.stringify({ pattern: DEVICES_CMD.REMOVE, data: id })),
    );

    this.events = this.events.filter((event) => event.id !== id);
  }

  @RabbitSubscribe({
    exchange: 'amq.topic',
    queue: DEVICES_ROUTES.OBSERVERS,
    allowNonJsonMessages: true,
    queueOptions: {
      durable: false,
      autoDelete: true,
    },
  })
  async handleDeviceResults(rawMsg: ObserverMessage) {
    const parsedMsg: Pick<Device, 'online'> | MessageData[] = JSON.parse(rawMsg.data);
    let msg;

    if (Array.isArray(parsedMsg)) {
      msg = parsedMsg[0];
    } else msg = parsedMsg;

    this.events.forEach((event) => {
      event.subject.next({ data: { ...msg, id: rawMsg.id } });
    });
  }
}
