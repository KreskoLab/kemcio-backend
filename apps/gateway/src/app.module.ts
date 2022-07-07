import { RmqModule } from '@app/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { AuthController } from './controllers/auth.controller';
import { DevicesController } from './controllers/devices.controller';
import { UsersController } from './controllers/users.controller';
import { WorkflowsController } from './controllers/workflows.controller';
import { DevicesGateway } from './gateways/device.gateway';
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
    RmqModule.register({ name: 'devices-new' }),
    RmqModule.register({ name: 'devices-cmd' }),
    RmqModule.register({ name: 'devices-add-remove-observer' }),
    RmqModule.register({ name: 'devices-element' }),
    RmqModule.register({ name: 'devices-wifi' }),
    RmqModule.register({ name: 'devices-update' }),
    RmqModule.register({ name: 'devices-remove' }),
    RmqModule.register({ name: 'workflows' }),
    RmqModule.register({ name: 'workflows-new' }),
    RmqModule.register({ name: 'workflows-update' }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABITMQ_URL'),
        enableControllerDiscovery: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppService, SseService, DevicesGateway],
  controllers: [AuthController, UsersController, DevicesController, WorkflowsController],
})
export class AppModule {}
