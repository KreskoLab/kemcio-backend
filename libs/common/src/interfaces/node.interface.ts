type NodeTrigger = {
  option: string;
  interval: number;
};

type NodeData = {
  device: string;
  element: string;
};

type NodeCommand = NodeData & { value: string };

export interface Node {
  id: string;
  data: NodeTrigger & NodeData & NodeCommand & string;
}
