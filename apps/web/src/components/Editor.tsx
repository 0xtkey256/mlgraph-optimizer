"use client";

import dynamic from "next/dynamic";
import { useGraphStore } from "../stores/graph-store";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ color: "var(--text-muted)" }}
    >
      Loading editor...
    </div>
  ),
});

export default function Editor() {
  const { source, setSource, compile, parseError } = useGraphStore();

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
        style={{
          background: "var(--bg-tertiary)",
          borderColor: "var(--border)",
        }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Model Definition
        </span>
        <button
          onClick={compile}
          className="text-xs font-medium px-3 py-1 rounded transition hover:brightness-110"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
          }}
        >
          Compile & Optimize
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage="plaintext"
          theme="vs-dark"
          value={source}
          onChange={(value) => setSource(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 8 },
            renderLineHighlight: "line",
            fontFamily: "var(--font-geist-mono), monospace",
            tabSize: 2,
          }}
        />
      </div>

      {parseError && (
        <div
          className="px-3 py-2 text-xs border-t"
          style={{
            background: "#1c0c0c",
            borderColor: "var(--danger)",
            color: "var(--danger)",
          }}
        >
          {parseError}
        </div>
      )}
    </div>
  );
}
