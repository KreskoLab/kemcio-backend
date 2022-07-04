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
    queue: 'new-workflows',
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
    queue: 'update-workflows',
    queueOptions: {
      autoDelete: true,
      durable: false,
    },
  })
  async updateWorkflow({ pattern, data }: { pattern: string; data: UpdateWorkflowDto }): Promise<Workflow> {
    return this.workflowsService.updateWorkflow(pattern, data);
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
      case 'get-workflows':
        return this.workflowsService.getWorkflows('_id name createdAt rawEdges rawNodes');

      case 'get-workflow':
        return this.workflowsService.getWorkflow(data);
    }
  }
}
