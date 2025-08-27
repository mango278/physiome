import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLatestHypothesisSummary, getLatestPlanSummary, getRecentLogs } from "@/lib/summaries";
import { systemPrompt, composeUserMessage } from "@/lib/ai/prompt";
import { streamChat } from "@/lib/ai/client";

export const runtime = "nodejs";

function assertEnv() {
  const missing: string[] = [];
  if (!process.env.MODEL_BASE_URL) missing.push("MODEL_BASE_URL");
  if (!process.env.MODEL_API_KEY) missing.push("MODEL_API_KEY");
  if (!process.env.MODEL_NAME) missing.push("MODEL_NAME");
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertEnv();

    const { input } = await req.json();
    if (!input || typeof input !== "string") {
      return Response.json({ error: "Missing 'input' string" }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[/api/ai/chat] auth.getUser error:", userErr);
      return Response.json({ error: "Auth error", detail: String(userErr.message || userErr) }, { status: 401 });
    }
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch concise context (RLS applies)
    const hypothesis = await getLatestHypothesisSummary(supabase);
    const plan = await getLatestPlanSummary(supabase, hypothesis?.id);
    const logs = await getRecentLogs(supabase, plan?.id, 3);

    // Simple red-flag gate
    const severe = logs.some((l: any) => (l.pain ?? 0) >= 7);
    if (severe) {
      return new Response(
        "Severe pain detected in logs. Please seek in-person care.",
        { status: 200, headers: { "Content-Type": "text/plain" } }
      );
    }

    const messages = [
      { role: "system", content: systemPrompt() },
      { role: "user", content: composeUserMessage(input, { hypothesis, plan, logs }) },
    ] as const;

    // Stream response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamChat({ messages: messages as any })) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err: any) {
          console.error("[/api/ai/chat] stream error:", err?.message, err);
          // Return error mid-stream as JSON block so client can display it
          const payload = JSON.stringify({ error: "Model stream failed", detail: String(err?.message || err) });
          controller.enqueue(encoder.encode(`\n\n${payload}\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("[/api/ai/chat] fatal:", err?.message, err);
    return Response.json(
      { error: "Server error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
