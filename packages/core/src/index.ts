// Graph IR
export type { Graph, Node, Edge, Port, GraphMetadata, PassRecord } from './ir/graph';
export {
  createGraph,
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  recordPass,
  getInputEdges,
  getOutputEdges,
  getProducers,
  getConsumers,
  topologicalSort,
  cloneGraph,
  genId,
  resetIdCounter,
} from './ir/graph';

export type { TensorType, DataType } from './ir/types';
export { tensorByteSize, shapeToString, tensorTypeToString } from './ir/types';

export type { OpType, OpSignature } from './ir/ops';
export { OP_REGISTRY, OP_COLORS } from './ir/ops';

// Parsers
export { parseDSL, parseDSLWithImplicitOutput } from './parser/dsl';
export { parseJsonModel } from './parser/json';
export type { JsonModel, JsonModelNode } from './parser/json';

// Optimization passes
export type { OptimizationPass, PassResult } from './passes';
export {
  runPass,
  runPipeline,
  shapeInferencePass,
  constantFoldingPass,
  deadCodeEliminationPass,
  operatorFusionPass,
  memoryPlanningPass,
} from './passes';

// Analysis
export type { GraphMetrics } from './analysis/metrics';
export { computeMetrics, formatBytes, formatFLOPs } from './analysis/metrics';
export type { GraphDiff } from './analysis/diff';
export { computeGraphDiff } from './analysis/diff';
