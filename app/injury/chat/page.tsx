"use client";

import { useState } from "react";
import { useAiChat } from "@/lib/ai/useChat";

export default function ChatPage() {
  const [q, setQ] = useState(
    "My shoulder still clicks on scaption above 90°—what should I adjust?"
  );
  const { loading, text, ask } = useAiChat();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">AI Physio Chat</h1>
      <textarea
        className="w-full border rounded p-2"
        rows={3}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button
        className="px-3 py-2 rounded bg-black text-white"
        disabled={loading}
        onClick={() => ask(q)}
      >
        {loading ? "Thinking…" : "Ask AI Physio"}
      </button>
      <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded min-h-[120px]">
        {text}
      </pre>
    </div>
  );
}
