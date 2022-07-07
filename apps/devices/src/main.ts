import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { DevicesModule } from './devices.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(DevicesModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(DevicesModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABITMQ_URL')],
    },
  });

  app.listen();
}
bootstrap();
