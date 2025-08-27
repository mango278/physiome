export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function* streamChat({
  baseUrl = process.env.MODEL_BASE_URL!,
  apiKey = process.env.MODEL_API_KEY!,
  model = process.env.MODEL_NAME || "gpt-oss-120b",
  messages,
}: {
  baseUrl?: string; apiKey?: string; model?: string; messages: ChatMessage[];
}) {
  // Fast env validation at source of truth too
  if (!baseUrl || !apiKey || !model) {
    throw new Error("MODEL_BASE_URL / MODEL_API_KEY / MODEL_NAME not configured");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const detail = text || `HTTP ${res.status}`;
    throw new Error(`Model API error: ${detail}`);
  }
  if (!res.body) throw new Error("Model API returned no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length) yield delta;
        // Also surface tool/usage errors if provider sends them inline
        if (json.error) throw new Error(`Provider error: ${JSON.stringify(json.error)}`);
      } catch (e) {
        // If it's not valid JSON, ignore that line
      }
    }
  }
}
