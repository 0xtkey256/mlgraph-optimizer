"use client";

import { create } from "zustand";
import type { Graph, PassResult, GraphMetrics } from "@mlgraph/core";
import {
  parseDSLWithImplicitOutput,
  resetIdCounter,
  runPipeline,
  shapeInferencePass,
  constantFoldingPass,
  deadCodeEliminationPass,
  operatorFusionPass,
  memoryPlanningPass,
  computeMetrics,
} from "@mlgraph/core";
import { EXAMPLES, DEFAULT_EXAMPLE } from "../lib/examples";

const ALL_PASSES = [
  shapeInferencePass,
  constantFoldingPass,
  deadCodeEliminationPass,
  operatorFusionPass,
  memoryPlanningPass,
];

export interface GraphState {
  // Source
  source: string;
  parseError: string | null;

  // Graph history: index 0 = original parsed graph, rest = after each pass
  history: { graph: Graph; label: string; metrics: GraphMetrics }[];
  currentStep: number;

  // Selected passes
  enabledPasses: boolean[];

  // Selected node
  selectedNodeId: string | null;

  // Actions
  setSource: (source: string) => void;
  compile: () => void;
  setStep: (step: number) => void;
  togglePass: (index: number) => void;
  selectNode: (nodeId: string | null) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  source: EXAMPLES[DEFAULT_EXAMPLE].code,
  parseError: null,
  history: [],
  currentStep: 0,
  enabledPasses: ALL_PASSES.map(() => true),
  selectedNodeId: null,

  setSource: (source) => set({ source }),

  compile: () => {
    const { source, enabledPasses } = get();
    try {
      resetIdCounter();
      const graph = parseDSLWithImplicitOutput(source);
      const originalMetrics = computeMetrics(graph);

      const activePasses = ALL_PASSES.filter((_, i) => enabledPasses[i]);
      const results = runPipeline(graph, activePasses);

      const history = [
        { graph, label: "Original", metrics: originalMetrics },
        ...results.map((r) => ({
          graph: r.graph,
          label: r.passName,
          metrics: computeMetrics(r.graph),
        })),
      ];

      set({ history, currentStep: 0, parseError: null, selectedNodeId: null });
    } catch (e: any) {
      set({ parseError: e.message, history: [], currentStep: 0 });
    }
  },

  setStep: (step) => set({ currentStep: step, selectedNodeId: null }),

  togglePass: (index) => {
    const passes = [...get().enabledPasses];
    passes[index] = !passes[index];
    set({ enabledPasses: passes });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
}));

export const PASS_INFO = ALL_PASSES.map((p) => ({
  name: p.name,
  description: p.description,
}));
