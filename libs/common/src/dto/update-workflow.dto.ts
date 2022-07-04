import { Edge, Node } from '@app/common';

export class UpdateWorkflowDto {
  rawNodes: string;
  rawEdges: string;
  nodes: Node[];
  edges: Edge[];
}
