import { Edge, Node, NODES, UpdateWorkflowDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { FlowManager, TaskResolverMap, TaskSpecMap } from 'flowed';
import { NodeCommandResolver, NodeDataResolver, NodeIfResolver } from './resolvers';
import { Workflow } from './schemas/workflow.schema';
import { useTaskData, useTaskDelay, useTaskIf, useTaskCommand } from './tasks';
import { WorkflowsRepository } from './workflows.repository';

type Params = {
  [key: string]: string | number;
};

type Trigger = {
  option: string;
  value: string;
};

type Tasks = {
  [key: string]: {
    requires: string[];
    provides: string[];
    resolver: {
      name: string;
      params: { [key: string]: string | number };
      results?: { [key: string]: string } | Record<string, never>;
    };
  };
};

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.runWorkflows();
  }

  async newWorkflow(name: string): Promise<Workflow> {
    return this.workflowsRepository.create(name);
  }

  async getWorkflows(select?: string): Promise<Workflow[]> {
    return this.workflowsRepository.findAll(select);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.workflowsRepository.findById(id);
  }

  async updateWorkflow(id: string, value: UpdateWorkflowDto): Promise<Workflow> {
    const workflow = await this.workflowsRepository.updateById(id, value);

    if (await this.cronJobExist(workflow.name)) {
      this.deleteCronJob(workflow.name);
    }

    if (!workflow.pause) await this.runWorkflow(workflow);
    return workflow;
  }

  async removeWorkflow(id: string): Promise<Workflow> {
    const workflow = await this.workflowsRepository.removeById(id);

    if (await this.cronJobExist(workflow.name)) {
      this.deleteCronJob(workflow.name);
    }

    return workflow;
  }

  async cronJobExist(name: string): Promise<boolean> {
    try {
      this.schedulerRegistry.getCronJob(name);
      return true;
    } catch (err) {
      return false;
    }
  }

  deleteCronJob(name: string): void {
    return this.schedulerRegistry.deleteCronJob(name);
  }

  async runWorkflows(): Promise<void> {
    const workflows = await this.getWorkflows('_id name pause edges nodes').then((res) =>
      res.filter((workflow) => !workflow.pause && workflow.nodes.length),
    );

    for (const workflow of workflows) {
      const tasks = {} as Tasks;
      const params = {} as Params;

      const startEdge = workflow.edges.find((edge) => edge.source === NODES.NodeTrigger);
      const trigger: Trigger = workflow.nodes.find((node) => node.id === startEdge.source).data;

      this.getWorkflowTasks(workflow.nodes, workflow.edges, startEdge, tasks, params, trigger);
      this.runTask(trigger, params, tasks, workflow.name);
    }
  }

  async runWorkflow(workflow: Workflow): Promise<void> {
    const tasks = {} as Tasks;
    const params = {} as Params;

    const startEdge = workflow.edges.find((edge) => edge.source === NODES.NodeTrigger);
    const trigger: Trigger = workflow.nodes.find((node) => node.id === startEdge.source).data;

    this.getWorkflowTasks(workflow.nodes, workflow.edges, startEdge, tasks, params, trigger);
    this.runTask(trigger, params, tasks, workflow.name);
  }

  private getWorkflowTasks(
    nodes: Node[],
    edges: Edge[],
    startEdge: Edge,
    tasks: Tasks,
    params: Params,
    trigger: Trigger,
  ) {
    let prevEdge = startEdge;

    while (true) {
      let lastEdge = false;
      let currentEdge = edges.find((edge) => edge.source === prevEdge.target);

      if (!currentEdge) {
        lastEdge = true;
        currentEdge = { source: prevEdge.target, sourceHandle: '', target: '', targetHandle: '' };
      }

      const edgeName = currentEdge.source.split('-')[0];
      const data = this.getWorkflowNodeData(nodes, currentEdge.source);

      switch (edgeName) {
        case NODES.NodeTrigger:
          trigger.option = data.option;
          trigger.value = data.value;
          break;

        case NODES.NodeDelay:
          const delay = currentEdge.source + 'delay';
          params[delay] = Number(data);
          tasks[currentEdge.source] = useTaskDelay(currentEdge.source, delay);
          break;

        case NODES.NodePower:
          const device = currentEdge.source + 'device';
          const element = currentEdge.source + 'element';
          const value = currentEdge.source + 'value';

          params[device] = data.device;
          params[element] = data.element;
          params[value] = data.value;

          tasks[currentEdge.source] = useTaskCommand(device, element, value);
          break;

        case NODES.NodeIf:
          const condition = edges.find(
            (edge) => edge.targetHandle === 'condition' && edge.target === currentEdge.source,
          );

          const conditionArgs = edges.filter((edge) => edge.target === condition.source);

          const argA = conditionArgs.find((item) => item.targetHandle === 'a');
          const argB = conditionArgs.find((item) => item.targetHandle === 'b');

          const conditionOperator = `${condition.source}-operator`;
          params[conditionOperator] = condition.source.split('-')[0];

          tasks[condition.source] = useTaskIf(condition.source, conditionOperator);

          this.handleConditionArg(tasks, params, nodes, condition, argA, 'a');
          this.handleConditionArg(tasks, params, nodes, condition, argB, 'b');

          const falseEdge = this.getFalseEdge(edges, currentEdge);

          if (falseEdge) {
            this.getWorkflowTasks(nodes, edges, falseEdge, tasks, params, trigger);
          }

          break;
      }

      if (prevEdge.source !== NODES.NodeTrigger) {
        if (prevEdge.source.includes(NODES.NodeIf) || currentEdge.source.includes(NODES.NodeIf)) {
          if (prevEdge.source.includes(NODES.NodeIf) && currentEdge.source.includes(NODES.NodeIf)) {
            const currentConditionEdge = edges.find(
              (edge) => edge.target === currentEdge.source && edge.targetHandle === 'condition',
            ).source;

            const prevConditionEdge = edges.find(
              (edge) => edge.target === prevEdge.source && edge.targetHandle === 'condition',
            ).source;

            tasks[currentConditionEdge].requires.push(prevConditionEdge + prevEdge.sourceHandle);
          }

          if (prevEdge.source.includes(NODES.NodeIf) && !currentEdge.source.includes(NODES.NodeIf)) {
            const conditionEdge = edges.find(
              (edge) => edge.target === prevEdge.source && edge.targetHandle === 'condition',
            ).source;

            tasks[currentEdge.source].requires.push(conditionEdge + prevEdge.sourceHandle);
          }

          if (currentEdge.source.includes(NODES.NodeIf) && !prevEdge.source.includes(NODES.NodeIf)) {
            const conditionEdge = edges.find(
              (edge) => edge.target === currentEdge.source && edge.targetHandle === 'condition',
            ).source;

            tasks[conditionEdge].requires.push(prevEdge.source);
          }
        } else {
          tasks[currentEdge.source].requires.push(prevEdge.source);
        }
      }

      if (lastEdge) break;
      else prevEdge = currentEdge;
    }
  }

  private handleConditionArg(tasks: Tasks, params: Params, nodes: Node[], condition: Edge, arg: Edge, type: 'a' | 'b') {
    const itemData = this.getWorkflowNodeData(nodes, arg.source);

    if (arg.source.includes(NODES.NodeData)) {
      const deviceId = `deviceId-${arg.source}`;
      const deviceElement = `deviceElement-${arg.source}`;

      tasks[arg.source] = useTaskData(arg.source, deviceId, deviceElement);
      tasks[condition.source].requires.push(arg.source);
      tasks[condition.source].resolver.params[type] = tasks[arg.source].resolver.results.data;

      const swap = [JSON.stringify(tasks[arg.source]), JSON.stringify(tasks[condition.source])];

      delete tasks[condition.source];
      delete tasks[arg.source];

      tasks[arg.source] = JSON.parse(swap[0]);
      tasks[condition.source] = JSON.parse(swap[1]);

      params[deviceId] = itemData.device;
      params[deviceElement] = itemData.element;
    } else {
      tasks[condition.source].requires.push(arg.source);
      tasks[condition.source].resolver.params[type] = arg.source;
      params[arg.source] = itemData;
    }
  }

  private getWorkflowNodeData(nodes: Node[], nodeId: string) {
    return nodes.find((node) => node.id === nodeId).data;
  }

  private getFalseEdge(edges: Edge[], currentEdge: Edge): Edge {
    return edges.find((edge) => edge.source === currentEdge.source && edge.sourceHandle === 'false');
  }

  private runTask(trigger: Trigger, params: Params, tasks: Tasks, name: string): void {
    const resolvers = {
      NodeDataResolver: NodeDataResolver,
      NodeIfResolver: NodeIfResolver,
      NodeCommandResolver: NodeCommandResolver,
    };

    const job = new CronJob(trigger.value, () => {
      FlowManager.run(
        {
          tasks: tasks as TaskSpecMap,
        },
        params,
        [],
        resolvers as unknown as TaskResolverMap,
      );
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }
}
