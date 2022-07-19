import { CreateWorkflowDto, UpdateWorkflowDto, WORKFLOWS_ROUTES } from '@app/common';
import { Body, Controller, Get, Inject, Post, Put, Param, UseGuards, Delete } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Workflow } from 'apps/workflows/src/schemas/workflow.schema';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../guards/auth.guard';

@Controller('workflows')
@UseGuards(AuthGuard)
export class WorkflowsController {
  constructor(
    @Inject(WORKFLOWS_ROUTES.NEW) private readonly newWorkflowsService: ClientProxy,
    @Inject(WORKFLOWS_ROUTES.UPDATE) private readonly updateWorkflowsService: ClientProxy,
    @Inject(WORKFLOWS_ROUTES.DATA) private readonly workflowsService: ClientProxy,
  ) {}

  @Get()
  async getWorkflows(): Promise<Workflow[]> {
    return firstValueFrom(this.workflowsService.send('workflows', ''));
  }

  @Post()
  async createWorkflow(@Body() workflow: CreateWorkflowDto): Promise<Workflow> {
    return firstValueFrom(this.newWorkflowsService.send('workflow-new', workflow));
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string): Promise<Workflow> {
    return firstValueFrom(this.workflowsService.send('workflow', id));
  }

  @Put(':id')
  async updateWorkflow(@Param('id') workflowId: string, @Body() workflow: UpdateWorkflowDto): Promise<Workflow> {
    return firstValueFrom(this.updateWorkflowsService.send('update', { body: workflow, id: workflowId }));
  }

  @Delete(':id')
  async removeWorkflow(@Param('id') workflowId: string): Promise<Workflow> {
    return firstValueFrom(this.updateWorkflowsService.send('remove', { id: workflowId }));
  }
}
