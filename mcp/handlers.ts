import type { SupabaseClient } from "@supabase/supabase-js";
import { seedDifferentials, type Subjective } from "@/lib/domain/hypothesis";
import { generateFromHypothesis } from "@/lib/domain/plan";

export async function createHypothesis(
  supabase: SupabaseClient,
  userId: string,
  report: Subjective
) {
  // Determine next version
  const { data: prev } = await supabase
    .from("injury_hypothesis")
    .select("version")
    .order("version", { ascending: false })
    .limit(1);

  const version = (prev?.[0]?.version || 0) + 1;
  const differentials = seedDifferentials(report);

  const insert = {
    user_id: userId,
    version,
    subjective: report,
    differentials,
    status: "active",
  };

  const { data, error } = await supabase.from("injury_hypothesis").insert(insert).select().single();
  if (error) throw new Error(`createHypothesis: ${error.message}`);
  return data;
}

export async function generatePlan(
  supabase: SupabaseClient,
  userId: string,
  hypothesisId: string,
  opts: { goals?: string[]; equipment?: string[] } = {}
) {
  const base = generateFromHypothesis(hypothesisId);
  const insert = {
    user_id: userId,
    linked_hypothesis: hypothesisId,
    version: 1,
    mesocycle_weeks: base.mesocycle_weeks,
    microcycles: base.microcycles,
    progression_logic: base.progression_logic,
  };
  const { data, error } = await supabase.from("workout_plan").insert(insert).select().single();
  if (error) throw new Error(`generatePlan: ${error.message}`);
  return data;
}

export async function logSession(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  payload: { pain?: number | null; rpe?: number | null; notes?: string | null }
) {
  const insert = {
    user_id: userId,
    plan_id: planId,
    exercises: [],
    pain: payload.pain != null ? { overall: payload.pain } : null,
    rpe: payload.rpe != null ? { overall: payload.rpe } : null,
    adherence: null,
    notes: payload.notes || null,
  };
  const { data, error } = await supabase.from("session_log").insert(insert).select().single();
  if (error) throw new Error(`logSession: ${error.message}`);
  return data;
}
