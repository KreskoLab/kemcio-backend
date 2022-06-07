import { RmqModule } from '@app/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { DevicesController } from './controllers/devices.controller';
import { UsersController } from './controllers/users.controller';
import { SseService } from './sse.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/gateway/.env',
    }),
    RmqModule.register({ name: 'users' }),
    RmqModule.register({ name: 'auth' }),
    RmqModule.register({ name: 'devices' }),
    RmqModule.register({ name: 'devices-add-observer' }),
    RmqModule.register({ name: 'devices-remove-observer' }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABITMQ_URL'),
        enableControllerDiscovery: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppService, SseService],
  controllers: [UsersController, DevicesController],
})
export class AppModule {}
