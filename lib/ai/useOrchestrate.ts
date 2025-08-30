"use client";
import { useState } from "react";

export function useOrchestrate() {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [changes, setChanges] = useState<any>(null);

  async function send(input: string) {
    setLoading(true);
    setReply("");
    setIntent(null);
    setChanges(null);

    const res = await fetch("/api/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReply(`Error: ${json?.detail || json?.error || res.status}`);
      setLoading(false);
      return;
    }
    setReply(json.reply || "");
    setIntent(json.intent || null);
    setChanges(json.changes || null);
    setLoading(false);
  }

  return { loading, reply, intent, changes, send };
}
