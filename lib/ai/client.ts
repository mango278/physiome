// Tiny OpenAI-compatible client using fetch + streaming (SSE-like).
// Works with providers that mimic the OpenAI Chat Completions API.
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function* streamChat({
  baseUrl = process.env.MODEL_BASE_URL!,
  apiKey = process.env.MODEL_API_KEY!,
  model = process.env.MODEL_NAME || "gpt-oss-120b",
  messages,
}: {
  baseUrl?: string; apiKey?: string; model?: string; messages: ChatMessage[];
}) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      // temperature/top_p etc. optional
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Model API error (${res.status}): ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // OpenAI-style event stream: lines starting with "data: ..."
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
        if (typeof delta === "string" && delta.length) {
          yield delta;
        }
      } catch {
        // ignore parse hiccups
      }
    }
  }
}

