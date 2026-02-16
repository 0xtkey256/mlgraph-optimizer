"use client";

import Header from "../components/Header";
import Editor from "../components/Editor";
import GraphView from "../components/GraphView";
import Sidebar from "../components/Sidebar";
import Timeline from "../components/Timeline";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 min-h-0">
        {/* Left: Editor */}
        <div
          className="flex flex-col border-r"
          style={{
            width: "320px",
            minWidth: "280px",
            borderColor: "var(--border)",
          }}
        >
          <Editor />
        </div>

        {/* Center: Graph + Timeline */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0">
            <GraphView />
          </div>
          <Timeline />
        </div>

        {/* Right: Sidebar */}
        <div style={{ width: "280px", minWidth: "240px" }}>
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
