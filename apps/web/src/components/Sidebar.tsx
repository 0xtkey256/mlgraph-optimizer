"use client";

import { useGraphStore, PASS_INFO } from "../stores/graph-store";
import { OP_REGISTRY, OP_COLORS } from "@mlgraph/core";
import type { Node } from "@mlgraph/core";
import { formatBytes, formatFLOPs } from "@mlgraph/core";

function NodeInspector({ node }: { node: Node }) {
  const sig = OP_REGISTRY[node.op];
  const color = sig ? OP_COLORS[sig.category] : "#64748b";
  const shape = node.outputs[0]?.tensorType;

  return (
    <div className="p-3 space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span className="text-sm font-semibold" style={{ color }}>
            {node.op}
          </span>
        </div>
        <p
          className="text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {node.name}
        </p>
        {sig && (
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {sig.description}
          </p>
        )}
      </div>

      {shape && (
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            Output Shape
          </p>
          <code
            className="text-xs px-2 py-1 rounded block"
            style={{
              background: "var(--bg-primary)",
              color: "var(--accent)",
              fontFamily: "monospace",
            }}
          >
            {shape.dtype}[{shape.shape.join(", ")}]
          </code>
        </div>
      )}

      {Object.keys(node.attributes).filter(k => !k.startsWith('_')).length > 0 && (
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            Attributes
          </p>
          <div className="space-y-1">
            {Object.entries(node.attributes)
              .filter(([k]) => !k.startsWith('_'))
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between text-xs"
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    {key}
                  </span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {JSON.stringify(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {node.inputs.length > 0 && (
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            Inputs: {node.inputs.length}
          </p>
        </div>
      )}
    </div>
  );
}

function MetricsPanel() {
  const { history, currentStep } = useGraphStore();
  const current = history[currentStep];
  if (!current) return null;

  const original = history[0];
  const m = current.metrics;
  const o = original.metrics;

  const delta = (curr: number, orig: number) => {
    if (orig === 0) return "";
    const pct = ((curr - orig) / orig) * 100;
    if (Math.abs(pct) < 0.1) return "";
    const sign = pct > 0 ? "+" : "";
    const color = pct < 0 ? "var(--success)" : pct > 0 ? "var(--danger)" : "var(--text-muted)";
    return (
      <span className="text-xs ml-1" style={{ color }}>
        {sign}{pct.toFixed(0)}%
      </span>
    );
  };

  return (
    <div className="p-3 space-y-2">
      <p
        className="text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        Metrics
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Nodes", value: m.nodeCount, orig: o.nodeCount },
          { label: "Edges", value: m.edgeCount, orig: o.edgeCount },
          { label: "FLOPs", value: formatFLOPs(m.totalFLOPs), orig: null },
          { label: "Memory", value: formatBytes(m.totalMemoryBytes), orig: null },
          { label: "Params", value: m.totalParams.toLocaleString(), orig: null },
          { label: "Depth", value: m.depth, orig: o.depth },
        ].map((item) => (
          <div
            key={item.label}
            className="p-2 rounded"
            style={{ background: "var(--bg-primary)" }}
          >
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {item.label}
            </p>
            <p className="text-sm font-medium">
              {item.value}
              {item.orig !== null && delta(item.value as number, item.orig as number)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PassesPanel() {
  const { enabledPasses, togglePass, compile, history } = useGraphStore();

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Optimization Passes
        </p>
        {history.length > 0 && (
          <button
            onClick={compile}
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
            }}
          >
            Re-run
          </button>
        )}
      </div>
      <div className="space-y-1">
        {PASS_INFO.map((pass, i) => (
          <label
            key={i}
            className="flex items-start gap-2 p-2 rounded cursor-pointer hover:brightness-110 transition"
            style={{ background: "var(--bg-primary)" }}
          >
            <input
              type="checkbox"
              checked={enabledPasses[i]}
              onChange={() => togglePass(i)}
              className="mt-0.5 accent-blue-500"
            />
            <div>
              <p className="text-xs font-medium">{pass.name}</p>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {pass.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { selectedNodeId, history, currentStep } = useGraphStore();
  const currentGraph = history[currentStep]?.graph;
  const selectedNode = selectedNodeId && currentGraph
    ? currentGraph.nodes.get(selectedNodeId)
    : null;

  return (
    <div
      className="h-full overflow-y-auto border-l"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {selectedNode ? (
        <>
          <div
            className="px-3 py-2 border-b flex items-center justify-between"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border)",
            }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Node Inspector
            </span>
            <button
              onClick={() => useGraphStore.getState().selectNode(null)}
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Close
            </button>
          </div>
          <NodeInspector node={selectedNode} />
        </>
      ) : (
        <>
          <div
            className="px-3 py-2 border-b"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border)",
            }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Configuration
            </span>
          </div>
          <PassesPanel />
          <div
            className="border-t"
            style={{ borderColor: "var(--border)" }}
          />
          <MetricsPanel />
        </>
      )}
    </div>
  );
}
