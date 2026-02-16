"use client";

import { useGraphStore } from "../stores/graph-store";

export default function Timeline() {
  const { history, currentStep, setStep } = useGraphStore();

  if (history.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-4 py-2 border-t overflow-x-auto shrink-0"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <span
        className="text-xs mr-2 shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        Pipeline:
      </span>
      {history.map((step, i) => (
        <button
          key={i}
          onClick={() => setStep(i)}
          className="text-xs px-3 py-1.5 rounded border transition shrink-0"
          style={{
            background:
              i === currentStep ? "var(--accent-subtle)" : "var(--bg-tertiary)",
            borderColor:
              i === currentStep ? "var(--accent)" : "var(--border)",
            color:
              i === currentStep ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          {step.label}
        </button>
      ))}
    </div>
  );
}
