"use client";
import { useState } from "react";

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  async function ask(input: string) {
    setLoading(true);
    setText("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      // If server returned JSON error, surface it
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.detail || err?.error || `HTTP ${res.status}`;
        setText(`Error: ${msg}`);
        setLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        const fallback = await res.text().catch(() => "");
        setText(`Error: ${fallback || `HTTP ${res.status}`}`);
        setLoading(false);
        return;
      }

      // Stream success
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((t) => t + decoder.decode(value));
      }
    } catch (e: any) {
      setText(`Error: ${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  return { loading, text, ask };
}
