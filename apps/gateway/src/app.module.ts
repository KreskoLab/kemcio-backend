import { AUTH_ROUTES, DEVICES_ROUTES, RmqModule, USERS_ROUTES, WORKFLOWS_ROUTES } from '@app/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { DevicesController } from './controllers/devices.controller';
import { UsersController } from './controllers/users.controller';
import { WorkflowsController } from './controllers/workflows.controller';
import { EventsService } from './events.service';
import { DevicesGateway } from './gateways/device.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/gateway/.env',
    }),
    RmqModule.register({ name: USERS_ROUTES.MAIN }),
    RmqModule.register({ name: AUTH_ROUTES.MAIN }),
    RmqModule.register({ name: DEVICES_ROUTES.DEVICES }),
    RmqModule.register({ name: DEVICES_ROUTES.NEW }),
    RmqModule.register({ name: DEVICES_ROUTES.CMD }),
    RmqModule.register({ name: DEVICES_ROUTES.OBSERVER }),
    RmqModule.register({ name: DEVICES_ROUTES.ELEMENTS }),
    RmqModule.register({ name: DEVICES_ROUTES.WIFI }),
    RmqModule.register({ name: DEVICES_ROUTES.UPDATE }),
    RmqModule.register({ name: DEVICES_ROUTES.REMOVE }),
    RmqModule.register({ name: WORKFLOWS_ROUTES.DATA }),
    RmqModule.register({ name: WORKFLOWS_ROUTES.NEW }),
    RmqModule.register({ name: WORKFLOWS_ROUTES.UPDATE }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABITMQ_URL'),
        enableControllerDiscovery: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EventsService, DevicesGateway],
  controllers: [AuthController, UsersController, DevicesController, WorkflowsController],
})
export class AppModule {}
