import { UpdateWorkflowDto } from '@app/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import { Workflow } from './schemas/workflow.schema';
import { WorkflowsService } from './workflows.service';

@Controller()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'workflows-new',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async newWorkflow({ data }: { data: string }): Promise<Workflow> {
    return this.workflowsService.newWorkflow(data);
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'workflows-update',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async updateWorkflow({
    pattern,
    data,
  }: {
    pattern: 'update' | 'remove';
    data: { body?: UpdateWorkflowDto; id: string };
  }): Promise<Workflow> {
    switch (pattern) {
      case 'update':
        return this.workflowsService.updateWorkflow(data.id, data.body);

      case 'remove':
        return this.workflowsService.removeWorkflow(data.id);
    }
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    queue: 'workflows',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async workflowsHanlder({ pattern, data }: { pattern: string; data: string }): Promise<Workflow | Workflow[]> {
    switch (pattern) {
      case 'workflows':
        return this.workflowsService.getWorkflows('_id pause name createdAt rawEdges rawNodes');

      case 'workflow':
        return this.workflowsService.getWorkflow(data);
    }
  }
}
