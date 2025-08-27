import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLatestHypothesisSummary, getLatestPlanSummary, getRecentLogs } from "@/lib/summaries";
import { systemPrompt, composeUserMessage } from "@/lib/ai/prompt";
import { streamChat } from "@/lib/ai/client";

export const runtime = "nodejs"; // ensure streaming works reliably

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (typeof input !== "string" || !input.trim()) {
      return new Response("Missing user input", { status: 400 });
    }

    // Authenticated Supabase client (RLS protects rows)
    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Fetch concise context under RLS
    const hypothesis = await getLatestHypothesisSummary(supabase);
    const plan = await getLatestPlanSummary(supabase, hypothesis?.id);
    const logs = await getRecentLogs(supabase, plan?.id, 3);

    // Compose messages
    const messages = [
      { role: "system", content: systemPrompt() },
      { role: "user", content: composeUserMessage(input, { hypothesis, plan, logs }) },
    ] as const;

    // Red-flag gating (very simple example)
    const severe = logs.some((l) => (l.pain ?? 0) >= 7);
    if (severe) {
      const msg = "Your recent logs show severe pain. Please seek in-person medical care. I won’t progress your plan right now.";
      return new Response(msg, { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // Stream back to client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamChat({ messages: messages as any })) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err: any) {
          controller.error(err);
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
    console.error(err);
    return new Response(`Error: ${err.message || "unknown"}`, { status: 500 });
  }
}

