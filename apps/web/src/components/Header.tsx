"use client";

import { useGraphStore } from "../stores/graph-store";
import { EXAMPLES } from "../lib/examples";

export default function Header() {
  const { setSource, compile } = useGraphStore();

  const loadExample = (key: string) => {
    const ex = EXAMPLES[key];
    if (ex) {
      setSource(ex.code);
      // Auto-compile after short delay
      setTimeout(() => {
        useGraphStore.getState().compile();
      }, 50);
    }
  };

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
            width="24"
            height="24"
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
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
          }}
        >
          v0.1
        </span>
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
          {Object.entries(EXAMPLES).map(([key, ex]) => (
            <option key={key} value={key}>
              {ex.name}
            </option>
          ))}
        </select>

        <a
          href="https://github.com/0xtkey256/mlgraph-optimizer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 rounded border hover:brightness-110 transition"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
