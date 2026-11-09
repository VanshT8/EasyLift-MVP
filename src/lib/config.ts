import type { CrowdLevel, EquipmentConfig, EquipmentId, Minutes, WorkoutConfig, WorkoutId } from "./types";

export const GYM = {
  name: "UMass Recreation Center",
  shortName: "UMass Rec Center",
  /** Sample capacity used to turn utilization into an occupancy figure. */
  capacity: 220,
} as const;

export const EQUIPMENT: EquipmentConfig[] = [
  { id: "squat-rack", name: "Squat racks", singular: "squat rack", total: 6, baseWaitMinutes: 12 },
  { id: "leg-press", name: "Leg presses", singular: "leg press", total: 4, baseWaitMinutes: 8 },
  { id: "bench-press", name: "Bench presses", singular: "bench press", total: 8, baseWaitMinutes: 10 },
  { id: "cable", name: "Cable machines", singular: "cable machine", total: 8, baseWaitMinutes: 6 },
  { id: "dumbbell", name: "Dumbbell stations", singular: "dumbbell station", total: 10, baseWaitMinutes: 4 },
  { id: "treadmill", name: "Treadmills", singular: "treadmill", total: 12, baseWaitMinutes: 7 },
];

export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e])) as Record<
  EquipmentId,
  EquipmentConfig
>;

/** Which equipment each workout depends on. Recommendation scoring only looks at these. */
export const WORKOUTS: WorkoutConfig[] = [
  { id: "legs", name: "Legs", equipment: ["squat-rack", "leg-press"] },
  { id: "chest", name: "Chest", equipment: ["bench-press", "cable"] },
  { id: "back", name: "Back", equipment: ["cable", "dumbbell"] },
  { id: "shoulders", name: "Shoulders", equipment: ["dumbbell", "cable"] },
  { id: "arms", name: "Arms", equipment: ["dumbbell", "cable"] },
  { id: "full-body", name: "Full Body", equipment: ["squat-rack", "bench-press", "cable", "dumbbell"] },
];

export const WORKOUT_BY_ID = Object.fromEntries(WORKOUTS.map((w) => [w.id, w])) as Record<
  WorkoutId,
  WorkoutConfig
>;

export const DURATIONS = [45, 60, 90] as const;

/** Demo opening hours by weekday (0 = Sunday). */
export const GYM_HOURS: Record<number, { open: Minutes; close: Minutes }> = {
  0: { open: 8 * 60, close: 20 * 60 },
  1: { open: 6 * 60, close: 23 * 60 },
  2: { open: 6 * 60, close: 23 * 60 },
  3: { open: 6 * 60, close: 23 * 60 },
  4: { open: 6 * 60, close: 23 * 60 },
  5: { open: 6 * 60, close: 21 * 60 },
  6: { open: 8 * 60, close: 20 * 60 },
};

export const SLOT_MINUTES = 30;

/** Utilization thresholds shared by equipment status and overall crowd level. */
export function levelForUtilization(utilization: number): CrowdLevel {
  if (utilization < 0.55) return "quiet";
  if (utilization < 0.75) return "moderate";
  return "busy";
}

export const LEVEL_LABEL: Record<CrowdLevel, string> = {
  quiet: "Quiet",
  moderate: "Moderate",
  busy: "Busy",
};

export const DEFAULT_NAME = "Alex";
