import type { SupabaseClient } from "@supabase/supabase-js";
import { createHypothesis, generatePlan, logSession } from "@/mcp/handlers";
import { Intent } from "@/lib/orchestration/intent";

export async function execute({
  supabase,
  userId,
  input,
  intent,
  ctx,
}: {
  supabase: SupabaseClient;
  userId: string;
  input: string;
  intent: Intent;
  ctx: { hypothesis?: any; plan?: any; logs?: any[] };
}) {
  // light parsers
  const pain = extractScale(input, /(pain|ache)/i);
  const rpe = extractScale(input, /\brpe\b/i);

  switch (intent) {
    case "log_session": {
      if (!ctx.plan?.id) {
        return {
          reply: "I don’t see an active plan. Tell me what hurts and I’ll create a hypothesis and plan.",
          intent,
          changes: null,
        };
      }
      const entry = await logSession(supabase, userId, ctx.plan.id, { pain, rpe, notes: input });
      return {
        reply: `Logged your session${pain != null ? ` (pain ${pain}/10)` : ""}${rpe != null ? ` (RPE ${rpe}/10)` : ""}.`,
        intent,
        changes: { session_log: entry },
      };
    }

    case "report_symptom": {
      // Create a new hypothesis version from the narrative
      const hyp = await createHypothesis(supabase, userId, { narrative: input });
      // Optionally generate a new plan linked to it
      const plan = await generatePlan(supabase, userId, hyp.id);
      return {
        reply: "I’ve updated your injury hypothesis and generated a new plan based on what you reported.",
        intent,
        changes: { injury_hypothesis: hyp, workout_plan: plan },
      };
    }

    case "request_plan": {
      let hypId = ctx.hypothesis?.id;
      if (!hypId) {
        const hyp = await createHypothesis(supabase, userId, { narrative: input });
        hypId = hyp.id;
      }
      const plan = await generatePlan(supabase, userId, hypId);
      return {
        reply: "Here’s a plan based on your current hypothesis.",
        intent,
        changes: { workout_plan: plan },
      };
    }

    case "ask_question":
    case "none":
    default:
      return {
        reply:
          "Got it. If you’d like me to log a session, say something like “I completed today’s session at RPE 6, pain 2/10.” If symptoms changed, tell me what’s new and I can update your hypothesis.",
        intent,
        changes: null,
      };
  }
}

function extractScale(text: string, key: RegExp): number | null {
  if (!key.test(text)) return null;
  const m = text.match(/(\d{1,2})\s*\/?\s*10/);
  if (m) {
    const n = Number(m[1]);
    if (!Number.isNaN(n) && n >= 0 && n <= 10) return n;
  }
  // Try bare integer 0..10 near the keyword
  const m2 = text.match(/(?:pain|rpe)[^\d]{0,6}(\d{1,2})/i);
  if (m2) {
    const n = Number(m2[1]);
    if (!Number.isNaN(n) && n >= 0 && n <= 10) return n;
  }
  return null;
}
