export type EquipmentId =
  | "squat-rack"
  | "leg-press"
  | "bench-press"
  | "cable"
  | "dumbbell"
  | "treadmill";

export type WorkoutId = "legs" | "chest" | "back" | "shoulders" | "arms" | "full-body";

export type CrowdLevel = "quiet" | "moderate" | "busy";

export type Duration = 45 | 60 | 90;

/** Calendar date in local time, formatted YYYY-MM-DD. */
export type DateKey = string;

/** Minutes after local midnight (e.g. 17:30 → 1050). */
export type Minutes = number;

export interface EquipmentConfig {
  id: EquipmentId;
  name: string;
  singular: string;
  total: number;
  /** Demo estimate of how long one person typically occupies a unit. */
  baseWaitMinutes: number;
}

export interface WorkoutConfig {
  id: WorkoutId;
  name: string;
  equipment: EquipmentId[];
}

export interface PlannerPreferences {
  workout: WorkoutId;
  date: DateKey;
  earliest: Minutes;
  latest: Minutes;
  duration: Duration;
  /** True once the user has run "Find Best Time"; the result then stays visible and live. */
  showResult: boolean;
}

export interface SavedPlan {
  id: string;
  workout: WorkoutId;
  date: DateKey;
  start: Minutes;
  end: Minutes;
  equipment: EquipmentId[];
  createdAt: number;
}

export type ConditionReport =
  | { id: string; kind: "crowd"; level: CrowdLevel; createdAt: number }
  | { id: string; kind: "equipment"; equipmentId: EquipmentId; inUse: number; createdAt: number };

export type FeedbackAnswer = "yes" | "maybe" | "no";

export interface FeedbackEntry {
  id: string;
  answer: FeedbackAnswer;
  comment: string;
  createdAt: number;
}

export interface PersistedState {
  version: 1;
  profile: { name: string; onboarded: boolean };
  preferences: PlannerPreferences;
  plans: SavedPlan[];
  reports: ConditionReport[];
  feedback: FeedbackEntry[];
}
