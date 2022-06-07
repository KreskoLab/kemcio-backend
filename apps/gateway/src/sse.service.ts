import { ObserverMessageI } from '@app/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, MessageEvent } from '@nestjs/common';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ClientProxy } from '@nestjs/microservices';
import { filter, Observable, Subject } from 'rxjs';

@Injectable()
export class SseService {
  constructor(
    private readonly amqpService: AmqpConnection,
    private readonly externalContextCreator: ExternalContextCreator,
    @Inject('devices-add-observer') private readonly addObserverService: ClientProxy,
    @Inject('devices-remove-observer') private readonly removeObserverService: ClientProxy,
  ) {}

  onModuleInit() {
    this.createQueue();
  }

  private subject = new Subject<MessageEvent>();

  addMessage(msg: object, observerId: string): void {
    this.subject.next({ data: msg, id: observerId });
  }

  send(observerId: string): Observable<MessageEvent> {
    return this.subject.pipe(filter((msg) => msg.id === observerId));
  }

  remove(observerId: string): void {
    this.removeObserverService.emit('remove', observerId);
  }

  addObserver(topicId: string, observer: string): void {
    this.addObserverService.emit('add', { topic: topicId, observerId: observer });
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

  private messageHandler(msg: ObserverMessageI): void {
    this.addMessage(JSON.parse(msg.data), msg.observerId);
  }
}
