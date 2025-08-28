// Helpers to fetch concise context for the model.
// Keep payloads small. All calls run under the current user session (RLS).
import { SupabaseClient } from "@supabase/supabase-js";

type HypothesisSummary = {
  id: string;
  version: number;
  differentials: Array<{ code: string; confidence: number }>;
  keyFindings?: string; // short text from subjective (optional)
};

type PlanSummary = {
  id: string;
  version: number;
  mesocycle_weeks: number;
  current_week: number;
  next_session_preview?: string; // human-short string
  rules?: string; // progression logic
};

type SessionMini = {
  id: string;
  performed_at: string;
  pain?: number | null; // optional overall
  rpe?: number | null;  // optional overall
  notes?: string | null;
};

export async function getLatestHypothesisSummary(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("injury_hypothesis")
    .select("id, version, subjective, differentials")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;

  const h = data[0] as any;
  const subj = h.subjective || {};
  const keyBits = [
    subj.narrative, subj.location, Array.isArray(subj.aggravators) ? subj.aggravators?.join(", ") : undefined
  ].filter(Boolean).join(" • ");

  const summary: HypothesisSummary = {
    id: h.id,
    version: h.version,
    differentials: h.differentials || [],
    keyFindings: keyBits.slice(0, 240),
  };
  return summary;
}

export async function getLatestPlanSummary(supabase: SupabaseClient, linkedHypothesisId?: string) {
  let query = supabase
    .from("workout_plan")
    .select("id, version, mesocycle_weeks, microcycles, progression_logic, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (linkedHypothesisId) query = query.eq("linked_hypothesis", linkedHypothesisId);

  const { data, error } = await query;
  if (error || !data?.length) return null;

  const p = data[0] as any;
  const current_week = Array.isArray(p.microcycles) && p.microcycles.length ? p.microcycles[0].week ?? 1 : 1;
  const nextSession =
    Array.isArray(p.microcycles) && p.microcycles[0]?.sessions?.[0]
      ? p.microcycles[0].sessions[0]
      : null;

  const next_session_preview = nextSession
    ? `${nextSession.day}: ${nextSession.exercises?.map((e: any) => e.name).slice(0, 3).join(", ")}`
    : undefined;

  const summary: PlanSummary = {
    id: p.id,
    version: p.version,
    mesocycle_weeks: p.mesocycle_weeks,
    current_week,
    next_session_preview,
    rules: (p.progression_logic || "").slice(0, 240),
  };
  return summary;
}

export async function getRecentLogs(supabase: SupabaseClient, planId?: string, limit = 3) {
  if (!planId) return [];
  const { data, error } = await supabase
    .from("session_log")
    .select("id, performed_at, pain, rpe, notes")
    .eq("plan_id", planId)
    .order("performed_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  const coerceNum = (v: any) => (typeof v === "number" ? v : (v?.overall ?? null));
  return data.map((row: any) => ({
    id: row.id,
    performed_at: row.performed_at,
    pain: coerceNum(row.pain),
    rpe: coerceNum(row.rpe),
    notes: row.notes,
  })) as SessionMini[];
}
