"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import ELK from "elkjs/lib/elk.bundled.js";
import { useGraphStore } from "../stores/graph-store";
import type { Graph, Node } from "@mlgraph/core";
import { OP_REGISTRY, OP_COLORS, getInputEdges, getOutputEdges } from "@mlgraph/core";

const elk = new ELK();

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  node: Node;
}

interface LayoutEdge {
  id: string;
  sections: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: { x: number; y: number }[] }[];
}

function getNodeColor(node: Node): string {
  const sig = OP_REGISTRY[node.op];
  return sig ? OP_COLORS[sig.category] : "#64748b";
}

async function layoutGraph(
  graph: Graph
): Promise<{ nodes: LayoutNode[]; edges: LayoutEdge[] }> {
  const elkNodes = Array.from(graph.nodes.values()).map((node) => ({
    id: node.id,
    width: 160,
    height: 50,
    labels: [{ text: node.name }],
  }));

  const elkEdges = graph.edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source.nodeId],
    targets: [edge.target.nodeId],
  }));

  const result = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "25",
      "elk.layered.spacing.nodeNodeBetweenLayers": "40",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    },
    children: elkNodes,
    edges: elkEdges,
  });

  const layoutNodes: LayoutNode[] = (result.children ?? []).map((c) => ({
    id: c.id,
    x: c.x ?? 0,
    y: c.y ?? 0,
    width: c.width ?? 160,
    height: c.height ?? 50,
    node: graph.nodes.get(c.id)!,
  }));

  const layoutEdges: LayoutEdge[] = (result.edges ?? []).map((e: any) => ({
    id: e.id,
    sections: e.sections ?? [],
  }));

  return { nodes: layoutNodes, edges: layoutEdges };
}

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { history, currentStep, selectedNodeId, selectNode } = useGraphStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const currentGraph = history[currentStep]?.graph;

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Render graph
  useEffect(() => {
    if (!currentGraph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    layoutGraph(currentGraph).then(({ nodes, edges }) => {
      // Center the graph
      const minX = Math.min(...nodes.map((n) => n.x));
      const minY = Math.min(...nodes.map((n) => n.y));
      const maxX = Math.max(...nodes.map((n) => n.x + n.width));
      const maxY = Math.max(...nodes.map((n) => n.y + n.height));
      const graphW = maxX - minX;
      const graphH = maxY - minY;
      const scale = Math.min(
        (dimensions.width - 40) / (graphW || 1),
        (dimensions.height - 40) / (graphH || 1),
        1.5
      );
      const tx = (dimensions.width - graphW * scale) / 2 - minX * scale;
      const ty = (dimensions.height - graphH * scale) / 2 - minY * scale;
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );

      // Arrow marker
      svg
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 10)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "var(--border)");

      // Draw edges
      const edgeGroup = g.append("g").attr("class", "edges");
      for (const edge of edges) {
        for (const section of edge.sections) {
          const points: [number, number][] = [
            [section.startPoint.x, section.startPoint.y],
            ...(section.bendPoints ?? []).map(
              (bp) => [bp.x, bp.y] as [number, number]
            ),
            [section.endPoint.x, section.endPoint.y],
          ];

          const line = d3
            .line<[number, number]>()
            .x((d) => d[0])
            .y((d) => d[1])
            .curve(d3.curveBasis);

          edgeGroup
            .append("path")
            .attr("d", line(points))
            .attr("class", "graph-edge")
            .attr("marker-end", "url(#arrow)");
        }
      }

      // Draw nodes
      const nodeGroup = g.append("g").attr("class", "nodes");
      for (const ln of nodes) {
        const color = getNodeColor(ln.node);
        const nodeG = nodeGroup
          .append("g")
          .attr("class", "graph-node")
          .attr("transform", `translate(${ln.x}, ${ln.y})`)
          .on("click", () => selectNode(ln.id));

        // Background rect
        nodeG
          .append("rect")
          .attr("width", ln.width)
          .attr("height", ln.height)
          .attr("rx", 6)
          .attr("fill", "var(--bg-tertiary)")
          .attr("stroke", selectedNodeId === ln.id ? "var(--accent)" : color)
          .attr("stroke-width", selectedNodeId === ln.id ? 2 : 1);

        // Color bar on left
        nodeG
          .append("rect")
          .attr("width", 4)
          .attr("height", ln.height)
          .attr("rx", 2)
          .attr("fill", color);

        // Op type label
        nodeG
          .append("text")
          .attr("x", 12)
          .attr("y", 18)
          .attr("font-size", "10px")
          .attr("font-weight", "600")
          .attr("fill", color)
          .text(ln.node.op);

        // Node name
        nodeG
          .append("text")
          .attr("x", 12)
          .attr("y", 34)
          .attr("font-size", "11px")
          .attr("fill", "var(--text-secondary)")
          .text(ln.node.name);

        // Shape label (if available)
        const shape = ln.node.outputs[0]?.tensorType?.shape;
        if (shape) {
          nodeG
            .append("text")
            .attr("x", ln.width - 6)
            .attr("y", 18)
            .attr("text-anchor", "end")
            .attr("font-size", "9px")
            .attr("font-family", "monospace")
            .attr("fill", "var(--text-muted)")
            .text(`[${shape.join("x")}]`);
        }
      }
    });
  }, [currentGraph, dimensions, selectedNodeId, selectNode]);

  if (!currentGraph) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-full"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="text-center">
          <p className="text-sm mb-2">No graph to display</p>
          <p className="text-xs">
            Write a model definition and click &quot;Compile & Optimize&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ background: "var(--bg-primary)" }}
      />
      <div
        className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded"
        style={{
          background: "var(--bg-secondary)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
      >
        {currentGraph.nodes.size} nodes &middot; {currentGraph.edges.length}{" "}
        edges
      </div>
    </div>
  );
}
