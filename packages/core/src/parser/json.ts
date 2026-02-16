import {
  Graph,
  Node,
  Edge,
  createGraph,
  addNode,
  addEdge,
  genId,
} from '../ir/graph';
import { OpType } from '../ir/ops';
import { TensorType } from '../ir/types';

export interface JsonModelNode {
  name: string;
  op: OpType;
  inputs?: string[];
  attributes?: Record<string, unknown>;
  tensorType?: TensorType;
}

export interface JsonModel {
  name: string;
  description?: string;
  nodes: JsonModelNode[];
  outputs?: string[];
}

export function parseJsonModel(model: JsonModel): Graph {
  let graph = createGraph(model.name, model.description ?? '');

  const nameToId = new Map<string, string>();

  // Create all nodes
  for (const def of model.nodes) {
    const nodeId = genId('n');
    const inputPorts = (def.inputs ?? []).map((_, i) => ({
      name: `input_${i}`,
    }));
    const outputPort = def.op === 'Output'
      ? []
      : [{ name: 'output', tensorType: def.tensorType }];
    const inputPortsForOutput = def.op === 'Output'
      ? [{ name: 'input' }]
      : inputPorts;

    const node: Node = {
      id: nodeId,
      op: def.op,
      name: def.name,
      inputs: def.op === 'Output' ? inputPortsForOutput : inputPorts,
      outputs: outputPort,
      attributes: def.attributes ?? {},
    };
    graph = addNode(graph, node);
    nameToId.set(def.name, nodeId);
  }

  // Create edges
  for (const def of model.nodes) {
    if (!def.inputs) continue;
    const targetId = nameToId.get(def.name)!;
    for (let i = 0; i < def.inputs.length; i++) {
      const sourceName = def.inputs[i];
      const sourceId = nameToId.get(sourceName);
      if (sourceId) {
        const edge: Edge = {
          id: genId('e'),
          source: { nodeId: sourceId, portIndex: 0 },
          target: { nodeId: targetId, portIndex: i },
        };
        graph = addEdge(graph, edge);
      }
    }
  }

  // Create output nodes if specified
  if (model.outputs) {
    for (const outName of model.outputs) {
      const sourceId = nameToId.get(outName);
      if (!sourceId) continue;
      const nodeId = genId('n');
      const node: Node = {
        id: nodeId,
        op: 'Output',
        name: `output_${outName}`,
        inputs: [{ name: 'input' }],
        outputs: [],
        attributes: {},
      };
      graph = addNode(graph, node);
      const edge: Edge = {
        id: genId('e'),
        source: { nodeId: sourceId, portIndex: 0 },
        target: { nodeId, portIndex: 0 },
      };
      graph = addEdge(graph, edge);
    }
  }

  return graph;
}
