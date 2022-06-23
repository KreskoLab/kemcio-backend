import { MongodbModule } from '@app/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DataRepository } from './data.repository';
import { DeviceRepository } from './device.repository';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { ObserversService } from './observers.service';
import { Data, DataSchema } from './schemas/data.schema';
import { Device, DeviceSchema } from './schemas/device.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/devices/.env',
    }),
    MongodbModule,
    MongooseModule.forFeature([
      {
        name: Device.name,
        schema: DeviceSchema,
      },
      {
        name: Data.name,
        schema: DataSchema,
      },
    ]),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABITMQ_URL'),
        enableControllerDiscovery: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DevicesController],
  providers: [DevicesService, ObserversService, DeviceRepository, DataRepository],
})
export class DevicesModule {}
