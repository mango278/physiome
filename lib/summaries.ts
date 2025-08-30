// Helpers to fetch concise context for the model and orchestrator.
// Keep payloads small. All calls run under the current user session (RLS).
import type { SupabaseClient } from "@supabase/supabase-js";

// -------------------- Types (exported) --------------------

export type HypothesisSummary = {
  id: string;
  version: number;
  differentials: Array<{ code: string; confidence: number }>;
  keyFindings?: string; // condensed subjective
};

export type PlanSummary = {
  id: string;
  version: number;
  linked_hypothesis?: string;
  mesocycle_weeks: number;
  current_week: number;
  next_session_preview?: string;
  rules?: string;
};

export type SessionMini = {
  id: string;
  performed_at: string;
  pain?: number | null; // overall 0..10
  rpe?: number | null;  // overall 0..10
  notes?: string | null;
};

export type RecentLogBundle = {
  logs: SessionMini[];
  medianPain?: number | null;
  medianRPE?: number | null;
};

// -------------------- Utils --------------------

function safeTrunc(s: unknown, n = 240): string | undefined {
  if (typeof s !== "string") return undefined;
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function asArray<T = unknown>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function median(nums: number[]): number | null {
  const arr = nums.filter((n) => typeof n === "number" && !Number.isNaN(n)) as number[];
  if (!arr.length) return null;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function coerceOverall(v: any): number | null {
  if (typeof v === "number") return v;
  if (v && typeof v.overall === "number") return v.overall;
  return null;
}

// -------------------- Summaries --------------------

export async function getLatestHypothesisSummary(supabase: SupabaseClient): Promise<HypothesisSummary | null> {
  const { data, error } = await supabase
    .from("injury_hypothesis")
    .select("id, version, subjective, differentials, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;

  const h: any = data[0];
  const subj = h.subjective || {};
  const bits = [
    subj.narrative,
    subj.location,
    asArray<string>(subj.aggravators).slice(0, 3).join(", "),
  ].filter(Boolean).join(" • ");

  return {
    id: h.id,
    version: h.version,
    differentials: asArray(h.differentials),
    keyFindings: safeTrunc(bits),
  };
}

/**
 * If linkedHypothesisId is provided, finds the newest plan for that hypothesis.
 * Otherwise, returns the user's newest plan.
 */
export async function getLatestPlanSummary(
  supabase: SupabaseClient,
  linkedHypothesisId?: string
): Promise<PlanSummary | null> {
  let query = supabase
    .from("workout_plan")
    .select("id, version, linked_hypothesis, mesocycle_weeks, microcycles, progression_logic, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (linkedHypothesisId) query = query.eq("linked_hypothesis", linkedHypothesisId);

  const { data, error } = await query;
  if (error || !data?.length) return null;

  const p: any = data[0];
  const micro = asArray<any>(p.microcycles);
  const firstWeek = micro[0] || {};
  const sessions = asArray<any>(firstWeek.sessions);
  const next = sessions[0];

  const nextPreview = next
    ? `${next.day}: ${asArray<any>(next.exercises).map((e) => e?.name).filter(Boolean).slice(0, 3).join(", ")}`
    : undefined;

  return {
    id: p.id,
    version: p.version,
    linked_hypothesis: p.linked_hypothesis ?? undefined,
    mesocycle_weeks: typeof p.mesocycle_weeks === "number" ? p.mesocycle_weeks : 6,
    current_week: typeof firstWeek.week === "number" ? firstWeek.week : 1,
    next_session_preview: nextPreview,
    rules: safeTrunc(p.progression_logic),
  };
}

/**
 * Returns last N logs plus quick medians for pain/RPE (overall).
 */
export async function getRecentLogs(
  supabase: SupabaseClient,
  planId?: string,
  limit = 3
): Promise<RecentLogBundle> {
  if (!planId) return { logs: [], medianPain: null, medianRPE: null };

  const { data, error } = await supabase
    .from("session_log")
    .select("id, performed_at, pain, rpe, notes")
    .eq("plan_id", planId)
    .order("performed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return { logs: [], medianPain: null, medianRPE: null };

  const logs: SessionMini[] = data.map((row: any) => ({
    id: row.id,
    performed_at: row.performed_at,
    pain: coerceOverall(row.pain),
    rpe: coerceOverall(row.rpe),
    notes: row.notes,
  }));

  const pains = logs.map((l) => l.pain!).filter((n) => typeof n === "number") as number[];
  const rpes = logs.map((l) => l.rpe!).filter((n) => typeof n === "number") as number[];

  return {
    logs,
    medianPain: median(pains),
    medianRPE: median(rpes),
  };
}
