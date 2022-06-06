import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { DevicesModule } from './devices.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(DevicesModule, {
    transport: Transport.RMQ,
  });

  app.listen();
}
bootstrap();
