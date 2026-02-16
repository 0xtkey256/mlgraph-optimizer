# Architecture

MLGraph Optimizer is organized as a Turborepo monorepo with three packages.

## Package Structure

```
mlgraph-optimizer/
├── apps/web/          → Next.js 16 frontend (deployed to Vercel)
├── packages/core/     → @mlgraph/core — TypeScript graph IR + optimizer
├── packages/ui/       → @mlgraph/ui — Shared visualization components
└── examples/          → .mlg model definition files
```

## @mlgraph/core

The core package contains all non-UI logic:

```
packages/core/src/
├── ir/
│   ├── graph.ts       → Graph, Node, Edge, Port types + immutable operations
│   ├── types.ts       → TensorType, DataType, Shape definitions
│   └── ops.ts         → 26+ ML operations with metadata and color mapping
├── passes/
│   ├── index.ts       → Pass registry, runPass(), runPipeline()
│   ├── shape-inference.ts
│   ├── constant-folding.ts
│   ├── dead-code-elimination.ts
│   ├── operator-fusion.ts
│   └── memory-planning.ts
├── parser/
│   ├── dsl.ts         → Model DSL parser → Graph IR
│   └── json.ts        → JSON model parser → Graph IR
├── analysis/
│   ├── metrics.ts     → FLOPs, params, memory, depth computation
│   └── diff.ts        → Structural diff between graph snapshots
└── index.ts           → Public API exports
```

## apps/web

The Next.js frontend:

```
apps/web/src/
├── app/
│   ├── layout.tsx     → Root layout with dark theme, Geist fonts
│   ├── page.tsx       → Main 3-panel layout
│   └── globals.css    → Dark theme CSS variables, graph styles
├── components/
│   ├── Editor.tsx     → Monaco editor with DSL syntax
│   ├── GraphView.tsx  → D3.js + ELK.js graph renderer
│   ├── Header.tsx     → Navigation, examples dropdown, stats
│   ├── Sidebar.tsx    → Node inspector, metrics, pass toggles
│   └── Timeline.tsx   → Optimization step timeline
├── stores/
│   └── graph-store.ts → Zustand store (source, history, passes)
└── lib/
    └── examples.ts    → 13 built-in model definitions
```

## Data Flow

```
User Input (DSL)
    │
    ▼
DSL Parser (packages/core/src/parser/dsl.ts)
    │
    ▼
Graph IR (packages/core/src/ir/graph.ts)
    │
    ▼
Pass Pipeline (packages/core/src/passes/)
    │  ┌─→ Shape Inference
    │  ├─→ Constant Folding
    │  ├─→ Dead Code Elimination
    │  ├─→ Operator Fusion
    │  └─→ Memory Planning
    │
    ▼
Graph History Array (stores/graph-store.ts)
    │
    ├─→ GraphView (D3.js + ELK.js rendering)
    ├─→ Timeline (step navigation)
    ├─→ Sidebar (metrics + inspector)
    └─→ Header (stats display)
```

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Monorepo | Turborepo + npm workspaces | Shared TypeScript packages with incremental builds |
| Frontend | Next.js 16, React 19 | App Router, server components, fast refresh |
| Styling | Tailwind CSS | Utility-first, dark theme via CSS variables |
| Editor | Monaco Editor | VS Code engine, syntax highlighting, auto-resize |
| Graph Layout | ELK.js | Layered algorithm optimized for DAGs with ports |
| Graph Rendering | D3.js (SVG) | Full control over node/edge rendering and animation |
| State | Zustand | Lightweight, TypeScript-first state management |
| Deployment | Vercel | Automatic monorepo builds, edge CDN |

## Graph Layout: ELK.js

The graph visualization uses ELK.js with the **layered** algorithm, configured for:

- **Direction**: Top to bottom (DOWN)
- **Edge routing**: Orthogonal (right-angle bends)
- **Crossing minimization**: LAYER_SWEEP algorithm
- **Node spacing**: 80px horizontal, 60px vertical

ELK was chosen over alternatives (dagre, D3-force) because it's specifically designed for layered directed graphs with port-based connections, producing clean layouts for computation graphs.
