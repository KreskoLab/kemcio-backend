import { RmqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/gateway/.env',
    }),
    RmqModule.register({ name: 'users' }),
    RmqModule.register({ name: 'auth' }),
  ],
  providers: [AppService],
  controllers: [UsersController],
})
export class AppModule {}
