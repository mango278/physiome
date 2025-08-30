export type Intent =
  | "clarify_needed"
  | "report_symptom"
  | "log_session"
  | "request_plan"
  | "update_hypothesis"
  | "adjust_plan"
  | "ask_question"
  | "red_flag"
  | "none";

const RED_FLAGS = [
  /numb|tingl|loss of sensation/i,
  /fever|chills|night sweats/i,
  /severe|unbearable/i,
  /(pain|ache)\s*(8|9|10)\/?10/i,
];

export function classifyIntent(
  text: string,
  _ctx: { hypothesis?: any; plan?: any; logs?: any[] }
): Intent {
  const t = text.trim();

  // quick red flag check (also enforced in policy)
  if (RED_FLAGS.some((r) => r.test(t))) return "red_flag";

  // log session
  if (/\b(rpe|rate of perceived|logged|did my|completed|today's session)\b/i.test(t)) {
    return "log_session";
  }

  // new / changed symptoms
  if (/\bnew|worse|now hurts|started hurting|clicking|swelling|tenderness\b/i.test(t)) {
    return "report_symptom";
  }

  // explicit ask for plan
  if (/\b(plan|workout|program)\b/i.test(t) && /\bmake|generate|update|adjust\b/i.test(t)) {
    return "request_plan";
  }

  // general ask
  if (/\bhow|should|can i|what if\b/i.test(t)) return "ask_question";

  // default: let policy/orchestrator decide next turn
  return "none";
}
