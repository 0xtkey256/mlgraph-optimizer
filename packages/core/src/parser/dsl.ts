import {
  Graph,
  Node,
  Edge,
  Port,
  createGraph,
  addNode,
  addEdge,
  genId,
} from '../ir/graph';
import { OpType } from '../ir/ops';
import { DataType, TensorType } from '../ir/types';

/**
 * Parses the MLGraph DSL into a Graph IR.
 *
 * Syntax:
 *   model <Name> {
 *     input <name>: Tensor<dtype>[d0, d1, ...]
 *     <name> = <Op>(<input>, key=value, ...)
 *     output <name>
 *   }
 */

interface ParsedInput {
  name: string;
  dtype: DataType;
  shape: number[];
}

interface ParsedCall {
  name: string;
  op: string;
  args: string[];
  kwargs: Record<string, string>;
}

interface ParsedOutput {
  name: string;
}

type ParsedStatement = ParsedInput | ParsedCall | ParsedOutput;

function isInput(s: ParsedStatement): s is ParsedInput {
  return 'dtype' in s;
}

function isOutput(s: ParsedStatement): s is ParsedOutput {
  return !('dtype' in s) && !('op' in s);
}

function tokenizeLine(line: string): string {
  // Strip comments
  const commentIdx = line.indexOf('//');
  return (commentIdx >= 0 ? line.slice(0, commentIdx) : line).trim();
}

function parseTensorType(spec: string): { dtype: DataType; shape: number[] } {
  // Tensor<float32>[1, 64, 56, 56]
  const m = spec.match(/Tensor<(\w+)>\[([^\]]+)\]/);
  if (!m) throw new Error(`Invalid tensor type: ${spec}`);
  const dtype = m[1] as DataType;
  const shape = m[2].split(',').map((s) => parseInt(s.trim(), 10));
  return { dtype, shape };
}

function parseStatement(line: string): ParsedStatement | null {
  if (!line || line === '{' || line === '}') return null;

  // input x: Tensor<float32>[1, 64, 56, 56]
  const inputMatch = line.match(/^input\s+(\w+)\s*:\s*(.+)$/);
  if (inputMatch) {
    const { dtype, shape } = parseTensorType(inputMatch[2].trim());
    return { name: inputMatch[1], dtype, shape };
  }

  // output = ReLU(out)   OR   output <name>
  // Check for assignment first
  const assignMatch = line.match(/^(\w+)\s*=\s*(\w+)\(([^)]*)\)$/);
  if (assignMatch) {
    const name = assignMatch[1];
    const op = assignMatch[2];
    const argsStr = assignMatch[3].trim();
    const args: string[] = [];
    const kwargs: Record<string, string> = {};

    if (argsStr) {
      for (const part of splitArgs(argsStr)) {
        const kwMatch = part.match(/^(\w+)\s*=\s*(.+)$/);
        if (kwMatch) {
          kwargs[kwMatch[1]] = kwMatch[2];
        } else {
          args.push(part);
        }
      }
    }
    return { name, op, args, kwargs };
  }

  // output <name>
  const outputMatch = line.match(/^output\s+(\w+)$/);
  if (outputMatch) {
    return { name: outputMatch[1] } as ParsedOutput;
  }

  return null;
}

function splitArgs(argsStr: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of argsStr) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

export function parseDSL(source: string): Graph {
  const lines = source.split('\n').map(tokenizeLine);

  // Extract model name
  const modelLine = lines.find((l) => l.startsWith('model '));
  const modelName = modelLine
    ? modelLine.match(/^model\s+(\w+)/)?.[1] ?? 'Untitled'
    : 'Untitled';

  let graph = createGraph(modelName, `Parsed from DSL`);

  const statements: ParsedStatement[] = [];
  for (const line of lines) {
    const stmt = parseStatement(line);
    if (stmt) statements.push(stmt);
  }

  // name → nodeId mapping
  const nameToNodeId = new Map<string, string>();

  // 1. Create input nodes
  for (const stmt of statements) {
    if (!isInput(stmt)) continue;
    const nodeId = genId('n');
    const tensorType: TensorType = { dtype: stmt.dtype, shape: stmt.shape };
    const node: Node = {
      id: nodeId,
      op: 'Input',
      name: stmt.name,
      inputs: [],
      outputs: [{ name: 'output', tensorType }],
      attributes: {},
    };
    graph = addNode(graph, node);
    nameToNodeId.set(stmt.name, nodeId);
  }

  // 2. Create operation nodes
  for (const stmt of statements) {
    if (isInput(stmt) || isOutput(stmt)) continue;
    const call = stmt as ParsedCall;
    const nodeId = genId('n');
    const inputs: Port[] = call.args.map((a, i) => ({ name: `input_${i}` }));
    const node: Node = {
      id: nodeId,
      op: call.op as OpType,
      name: call.name,
      inputs,
      outputs: [{ name: 'output' }],
      attributes: { ...call.kwargs },
    };
    graph = addNode(graph, node);
    nameToNodeId.set(call.name, nodeId);

    // Create edges from args
    for (let i = 0; i < call.args.length; i++) {
      const argName = call.args[i];
      const sourceNodeId = nameToNodeId.get(argName);
      if (sourceNodeId) {
        const edge: Edge = {
          id: genId('e'),
          source: { nodeId: sourceNodeId, portIndex: 0 },
          target: { nodeId, portIndex: i },
        };
        graph = addEdge(graph, edge);
      }
    }
  }

  // 3. Create output nodes
  for (const stmt of statements) {
    if (!isOutput(stmt)) continue;
    const sourceNodeId = nameToNodeId.get(stmt.name);
    if (!sourceNodeId) continue;
    const nodeId = genId('n');
    const node: Node = {
      id: nodeId,
      op: 'Output',
      name: `output_${stmt.name}`,
      inputs: [{ name: 'input' }],
      outputs: [],
      attributes: {},
    };
    graph = addNode(graph, node);
    const edge: Edge = {
      id: genId('e'),
      source: { nodeId: sourceNodeId, portIndex: 0 },
      target: { nodeId, portIndex: 0 },
    };
    graph = addEdge(graph, edge);
  }

  return graph;
}

// Parse a "output = Op(x)" line where `output` is used as the final output keyword
// Handle the case where the last assignment IS the output
export function parseDSLWithImplicitOutput(source: string): Graph {
  // Check if there's an explicit "output" statement
  const hasExplicitOutput = source.split('\n').some((l) => {
    const trimmed = l.trim();
    return trimmed.match(/^output\s+\w+$/) !== null;
  });

  if (hasExplicitOutput) {
    return parseDSL(source);
  }

  // Find last assignment and add implicit output
  const lines = source.split('\n');
  let lastAssignName = '';
  for (const line of lines) {
    const m = line.trim().match(/^(\w+)\s*=/);
    if (m) lastAssignName = m[1];
  }

  if (lastAssignName) {
    return parseDSL(source + `\n  output ${lastAssignName}`);
  }

  return parseDSL(source);
}
