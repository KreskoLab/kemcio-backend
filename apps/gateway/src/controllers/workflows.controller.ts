import { CreateWorkflowDto, UpdateWorkflowDto } from '@app/common';
import { Body, Controller, Get, Inject, Post, Put, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Workflow } from 'apps/workflows/src/schemas/workflow.schema';
import { firstValueFrom } from 'rxjs';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    @Inject('new-workflows') private readonly newWorkflowsService: ClientProxy,
    @Inject('update-workflows') private readonly updateWorkflowsService: ClientProxy,
    @Inject('workflows') private readonly workflowsService: ClientProxy,
  ) {}

  @Get()
  async getWorkflows(): Promise<Workflow[]> {
    return firstValueFrom(this.workflowsService.send('get-workflows', ''));
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string): Promise<Workflow> {
    return firstValueFrom(this.workflowsService.send('get-workflow', id));
  }

  @Post()
  async createWorkflow(@Body() workflow: CreateWorkflowDto): Promise<Workflow> {
    return firstValueFrom(this.newWorkflowsService.send('new-workflow', workflow));
  }

  @Put(':id')
  async updateWorkflow(@Param('id') id: string, @Body() workflow: UpdateWorkflowDto): Promise<Workflow> {
    return firstValueFrom(this.updateWorkflowsService.send(id, workflow));
  }
}
