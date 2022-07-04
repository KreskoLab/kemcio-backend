import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { WorkflowsModule } from './workflows.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(WorkflowsModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(WorkflowsModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABITMQ_URL')],
    },
  });

  app.listen();
}
bootstrap();
