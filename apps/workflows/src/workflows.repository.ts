import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workflow, WorkflowDocument } from './schemas/workflow.schema';

@Injectable()
export class WorkflowsRepository {
  constructor(@InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>) {}

  async create(name: string): Promise<Workflow> {
    return this.workflowModel.create(name);
  }

  async findAll(select?: string): Promise<Workflow[]> {
    return this.workflowModel.find({}, select);
  }

  async findById(id: string): Promise<Workflow> {
    return this.workflowModel.findById(id);
  }

  async updateById(id: string, fields: Partial<Workflow>): Promise<Workflow> {
    return this.workflowModel.findByIdAndUpdate(id, { $set: fields }, { new: true });
  }
}
