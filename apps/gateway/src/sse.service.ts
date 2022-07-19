import { DEVICES_ROUTES, ObserverMessage } from '@app/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, MessageEvent } from '@nestjs/common';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ClientProxy } from '@nestjs/microservices';
import { map, Observable, Subject } from 'rxjs';

@Injectable()
export class SseService {
  constructor(
    private readonly amqpService: AmqpConnection,
    private readonly externalContextCreator: ExternalContextCreator,
    @Inject(DEVICES_ROUTES.OBSERVER) private readonly observersService: ClientProxy,
  ) {}

  onModuleInit() {
    this.createQueue();
  }

  private subject = new Subject<MessageEvent>();

  addMessage(msg: object[] | object, deviceId: string): void {
    if (Array.isArray(msg) && msg.length) {
      this.subject.next({ data: msg, id: deviceId });
    } else {
      if (Object.keys(msg).length) this.subject.next({ data: msg, id: deviceId });
    }
  }

  send(): Observable<MessageEvent> {
    return this.subject.pipe(map((msg) => msg));
  }

  remove(id: string): void {
    this.observersService.emit('remove', id);
  }

  add(id: string): void {
    this.observersService.emit('add', id);
  }

  private createQueue(): void {
    this.amqpService.createSubscriber(
      this.externalContextCreator.create(this, this.messageHandler, this.messageHandler.name),
      {
        queue: 'devices-observers',
        exchange: 'amq.topic',
        allowNonJsonMessages: true,
        createQueueIfNotExists: true,
        queueOptions: {
          autoDelete: true,
          durable: false,
        },
      },
      'devices-observers',
    );
  }

  private messageHandler(msg: ObserverMessage): void {
    this.addMessage(JSON.parse(msg.data), msg.id);
  }
}
