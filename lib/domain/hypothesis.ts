export type Subjective = {
  narrative: string;
  onset?: string;
  location?: string;
  aggravators?: string[];
  easers?: string[];
  red_flags?: string[];
};

export function seedDifferentials(report: Subjective) {
  const txt = `${report.narrative} ${(report.aggravators || []).join(" ")}`.toLowerCase();
  const diffs: { code: string; confidence: number }[] = [];

  if (/(overhead|press|pull[- ]?up)/.test(txt)) {
    diffs.push({ code: "SIS_subacromial", confidence: 0.5 });
    diffs.push({ code: "RC_strain", confidence: 0.3 });
  }
  if (/(bicep|biceps|groove)/.test(txt)) {
    diffs.push({ code: "LHBT_tendinopathy", confidence: 0.4 });
  }
  if (!diffs.length) diffs.push({ code: "NonSpecific_shoulder_pain", confidence: 0.6 });

  const sum = diffs.reduce((s, d) => s + d.confidence, 0);
  return diffs.map((d) => ({ ...d, confidence: +(d.confidence / sum).toFixed(2) }));
}
