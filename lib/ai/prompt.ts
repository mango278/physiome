// System prompt + context composer. Keep it short to save tokens.
export function systemPrompt() {
  return [
    "You are an AI Physio.",
    "Goal: help the user safely rehab by reading the latest hypothesis, plan, and recent logs.",
    "Guardrails: if severe pain/red-flag symptoms, advise in-person care and do not progress the plan.",
    "Policy: read context first; be concise; explain rationale for any progression/regression.",
  ].join(" ");
}

export function composeUserMessage(userInput: string, ctx: {
  hypothesis?: any | null;
  plan?: any | null;
  logs?: Array<any>;
}) {
  const parts: string[] = [];
  if (ctx.hypothesis) {
    parts.push(`HYPOTHESIS v${ctx.hypothesis.version} (${ctx.hypothesis.id}):`);
    parts.push(`- Differentials: ${ctx.hypothesis.differentials?.map((d: any) => `${d.code}:${d.confidence}`).join(", ") || "n/a"}`);
    if (ctx.hypothesis.keyFindings) parts.push(`- Key findings: ${ctx.hypothesis.keyFindings}`);
  }
  if (ctx.plan) {
    parts.push(`PLAN v${ctx.plan.version} (${ctx.plan.id}): week ${ctx.plan.current_week}/${ctx.plan.mesocycle_weeks}`);
    if (ctx.plan.rules) parts.push(`- Rules: ${ctx.plan.rules}`);
    if (ctx.plan.next_session_preview) parts.push(`- Next session: ${ctx.plan.next_session_preview}`);
  }
  if (ctx.logs?.length) {
    parts.push(`RECENT LOGS:`);
    ctx.logs.forEach((l: any) => {
      parts.push(`- ${l.performed_at}: pain=${l.pain ?? "?"}, rpe=${l.rpe ?? "?"}${l.notes ? `, notes="${String(l.notes).slice(0,80)}"` : ""}`);
    });
  }
  parts.push(`USER INPUT: ${userInput}`);
  return parts.join("\n");
}

