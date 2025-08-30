export function generateFromHypothesis(h: any) {
  const microcycles = [
    {
      week: 1,
      sessions: [
        {
          day: "Mon",
          exercises: [
            { name: "Scaption to 90°", sets: 3, reps: "10–12", RPE: 6, notes: "Pain-free range" },
            { name: "Isometric ER @ side", sets: 3, reps: "3x30s", RPE: "comfortable" },
          ],
        },
        {
          day: "Thu",
          exercises: [
            { name: "Cable row (neutral)", sets: 3, reps: "8–10", RPE: 6 },
            { name: "Prone Y-T-W", sets: 2, reps: "8 each", RPE: 5 },
          ],
        },
      ],
    },
  ];

  const progression_logic =
    "If median RPE ≤5 and pain ≤2/10 for 2 sessions → +5° ROM or +1 set next week. If RPE ≥8 or pain ≥4/10 → regress ROM/load or swap to isometric.";

  return { microcycles, progression_logic, mesocycle_weeks: 6, version: 1 };
}
