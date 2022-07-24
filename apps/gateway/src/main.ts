import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  app.use(helmet());

  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new WsAdapter(app));
  app.use(cookieParser());

  console.log(configService.get<string>('FRONTEND_URLS'));

  app.enableCors({
    origin: JSON.parse(configService.get<string>('FRONTEND_URLS')),
    credentials: true,
    optionsSuccessStatus: 204,
  });

  await app.listen(8000);
}
bootstrap();
