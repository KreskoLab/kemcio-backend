import { MongodbModule } from '@app/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkflowSchema, Workflow } from './schemas/workflow.schema';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsRepository } from './workflows.repository';
import { WorkflowsService } from './workflows.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/workflows/.env',
    }),
    HttpModule,
    MongodbModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      {
        name: Workflow.name,
        schema: WorkflowSchema,
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
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsRepository],
})
export class WorkflowsModule {}
