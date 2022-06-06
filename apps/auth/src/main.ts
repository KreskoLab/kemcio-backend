import { AuthModule } from './auth.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.RMQ,
    options: {
      urls: configService.get('RABITMQ_URL'),
      queue: configService.get('RABITMQ_QUEUE'),
      queueOptions: {
        durable: false,
        autoDelete: true,
      },
    },
  });

  app.listen();
  appContext.close();
}

bootstrap();
