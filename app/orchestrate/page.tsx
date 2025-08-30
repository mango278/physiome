"use client";
import { useState } from "react";
import { useOrchestrate } from "@/lib/ai/useOrchestrate";

export default function OrchestrateDemo() {
  const [q, setQ] = useState("I completed today’s session at RPE 6, pain 2/10.");
  const { loading, reply, intent, changes, send } = useOrchestrate();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Orchestrator Demo</h1>
      <textarea className="w-full border rounded p-2" rows={3} value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="px-3 py-2 rounded bg-black text-white" disabled={loading} onClick={() => send(q)}>
        {loading ? "Working…" : "Send"}
      </button>
      <div className="space-y-2">
        <p><strong>Intent:</strong> {intent ?? "—"}</p>
        <p><strong>Reply:</strong> {reply}</p>
        {changes && (
          <pre className="bg-gray-50 p-3 rounded whitespace-pre-wrap text-xs">
            {JSON.stringify(changes, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
