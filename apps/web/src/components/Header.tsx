"use client";

import { useGraphStore } from "../stores/graph-store";
import { EXAMPLES, EXAMPLE_CATEGORIES } from "../lib/examples";

export default function Header() {
  const { setSource, compile, history } = useGraphStore();

  const loadExample = (key: string) => {
    const ex = EXAMPLES[key];
    if (ex) {
      setSource(ex.code);
      setTimeout(() => {
        useGraphStore.getState().compile();
      }, 50);
    }
  };

  const currentMetrics = history.length > 0 ? history[0]?.metrics : null;
  const optimizedMetrics =
    history.length > 1 ? history[history.length - 1]?.metrics : null;

  return (
    <header
      className="flex items-center justify-between px-4 h-12 border-b shrink-0"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="12" y1="8" x2="5" y2="16" />
            <line x1="12" y1="8" x2="19" y2="16" />
          </svg>
          <span className="font-semibold text-sm tracking-tight">
            MLGraph Optimizer
          </span>
        </div>

        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
          }}
        >
          v0.1
        </span>

        {/* Quick stats */}
        {currentMetrics && optimizedMetrics && (
          <div
            className="hidden md:flex items-center gap-3 ml-2 pl-3 border-l text-xs"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <span>
              Nodes: {currentMetrics.nodeCount} &rarr;{" "}
              <span style={{ color: "var(--success)" }}>
                {optimizedMetrics.nodeCount}
              </span>
            </span>
            <span>
              Edges: {currentMetrics.edgeCount} &rarr;{" "}
              <span style={{ color: "var(--success)" }}>
                {optimizedMetrics.edgeCount}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          onChange={(e) => loadExample(e.target.value)}
          defaultValue=""
          className="text-xs px-2 py-1 rounded border outline-none cursor-pointer"
          style={{
            background: "var(--bg-tertiary)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="" disabled>
            Load Example...
          </option>
          {EXAMPLE_CATEGORIES.map((cat) => (
            <optgroup label={cat} key={cat}>
              {Object.entries(EXAMPLES)
                .filter(([, ex]) => ex.category === cat)
                .map(([key, ex]) => (
                  <option key={key} value={key}>
                    {ex.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>

        <a
          href="https://0xtkey256.gitbook.io/mlgraph-optimizer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 rounded border hover:brightness-110 transition"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Docs
        </a>

        <a
          href="https://github.com/0xtkey256/mlgraph-optimizer"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:brightness-110 transition"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
