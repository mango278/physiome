"use client";

import { useState } from "react";

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  async function ask(input: string) {
    setLoading(true);
    setText("");

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    if (!res.ok || !res.body) {
      setLoading(false);
      throw new Error(`HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setText((t) => t + decoder.decode(value));
    }

    setLoading(false);
  }

  return { loading, text, ask };
}
