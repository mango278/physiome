import { NextRequest } from "next/server";
import { streamChat } from "@/lib/ai/client"; // you already built this earlier
import { systemPrompt, composeUserMessage } from "@/lib/ai/prompt";
import { supabaseServer } from "@/lib/supabase/server";
import {
  getLatestHypothesisSummary,
  getLatestPlanSummary,
  getRecentLogs,
} from "@/lib/summaries";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      return new Response("Missing input", { status: 400 });
    }

    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return new Response("Unauthorized", { status: 401 });

    const hypothesis = await getLatestHypothesisSummary(supabase);
    const plan = await getLatestPlanSummary(supabase, hypothesis?.id);
    const logs = await getRecentLogs(supabase, plan?.id, 3);

    const messages = [
      { role: "system", content: systemPrompt() },
      {
        role: "user",
        content: composeUserMessage(input, { hypothesis, plan, logs }),
      },
    ] as const;

    const severe = logs.some((l) => (l.pain ?? 0) >= 7);
    if (severe) {
      return new Response(
        "Severe pain detected in logs. Please seek in-person care.",
        { status: 200, headers: { "Content-Type": "text/plain" } }
      );
    }

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
    return new Response("Error", { status: 500 });
  }
}
