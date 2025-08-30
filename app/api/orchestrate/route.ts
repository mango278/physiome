import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyIntent } from "@/lib/orchestration/intent";
import { shouldGateForRedFlags } from "@/lib/orchestration/policy";
import { execute } from "@/lib/orchestration/execute";
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
      return Response.json({ error: "Missing 'input' string" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Load minimal context (RLS applies)
    const hypothesis = await getLatestHypothesisSummary(supabase);
    const plan = await getLatestPlanSummary(supabase, hypothesis?.id);
    const logs = await getRecentLogs(supabase, plan?.id, 3);

    // Safety first
    if (shouldGateForRedFlags(input, logs)) {
      return Response.json({
        reply:
          "Your recent input/logs suggest red-flag symptoms. Please seek in-person medical care. I won’t change your plan right now.",
        intent: "red_flag",
        changes: null,
      });
    }

    // Classify the user's intent for this turn
    const intent = classifyIntent(input, { hypothesis, plan, logs });

    // Execute (may read/write DB via tools)
    const result = await execute({
      supabase,
      userId: user.id,
      input,
      intent,
      ctx: { hypothesis, plan, logs },
    });

    return Response.json(result);
  } catch (e: any) {
    console.error("[/api/orchestrate] fatal:", e?.message, e);
    return Response.json({ error: "Server error", detail: String(e?.message || e) }, { status: 500 });
  }
}
