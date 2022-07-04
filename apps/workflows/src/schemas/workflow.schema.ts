import { Edge, Node } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type WorkflowDocument = Document & Workflow;

@Schema({ versionKey: false, timestamps: true })
export class Workflow {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false })
  rawNodes: string;

  @Prop({ required: false })
  rawEdges: string;

  @Prop({ required: false })
  nodes: Node[];

  @Prop({ required: false })
  edges: Edge[];

  @Prop({ required: false, default: false })
  pause: boolean;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
