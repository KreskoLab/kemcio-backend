import { RmqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { DevicesController } from './controllers/devices.controller';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/gateway/.env',
    }),
    RmqModule.register({ name: 'users' }),
    RmqModule.register({ name: 'auth' }),
    RmqModule.register({ name: 'devices' }),
  ],
  providers: [AppService],
  controllers: [UsersController, DevicesController],
})
export class AppModule {}
