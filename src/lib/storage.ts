/**
 * Versioned localStorage persistence exposed as an external store, so React can read it
 * with useSyncExternalStore (server snapshot = null → no hydration mismatch).
 * Falls back to in-memory state when storage is unavailable (e.g. blocked cookies).
 */
import { DEFAULT_NAME, DURATIONS, EQUIPMENT_BY_ID, WORKOUT_BY_ID } from "./config";
import { isDateKey } from "./time";
import type {
  ConditionReport,
  Duration,
  FeedbackEntry,
  PersistedState,
  PlannerPreferences,
  SavedPlan,
} from "./types";

export const STORAGE_KEY = "easylift:v1";

export function defaultState(): PersistedState {
  return {
    version: 1,
    profile: { name: DEFAULT_NAME, onboarded: false },
    preferences: {
      workout: "legs",
      date: "",
      earliest: 16 * 60,
      latest: 21 * 60,
      duration: 60,
      showResult: false,
    },
    plans: [],
    reports: [],
    feedback: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isMinute = (v: unknown): v is number => isNum(v) && v >= 0 && v <= 1440 && v % 30 === 0;

function sanitizePreferences(v: unknown): PlannerPreferences {
  const d = defaultState().preferences;
  if (!isObj(v)) return d;
  return {
    workout: typeof v.workout === "string" && v.workout in WORKOUT_BY_ID ? (v.workout as PlannerPreferences["workout"]) : d.workout,
    date: isDateKey(v.date) ? v.date : d.date,
    earliest: isMinute(v.earliest) ? v.earliest : d.earliest,
    latest: isMinute(v.latest) ? v.latest : d.latest,
    duration: DURATIONS.includes(v.duration as Duration) ? (v.duration as Duration) : d.duration,
    showResult: v.showResult === true,
  };
}

function sanitizePlan(v: unknown): SavedPlan | null {
  if (!isObj(v)) return null;
  if (typeof v.id !== "string" || !isDateKey(v.date) || !isMinute(v.start) || !isNum(v.end) || !isNum(v.createdAt))
    return null;
  if (typeof v.workout !== "string" || !(v.workout in WORKOUT_BY_ID)) return null;
  const equipment = Array.isArray(v.equipment) ? v.equipment.filter((id) => typeof id === "string" && id in EQUIPMENT_BY_ID) : [];
  return { ...(v as unknown as SavedPlan), equipment };
}

function sanitizeReport(v: unknown): ConditionReport | null {
  if (!isObj(v) || typeof v.id !== "string" || !isNum(v.createdAt)) return null;
  if (v.kind === "crowd" && (v.level === "quiet" || v.level === "moderate" || v.level === "busy")) {
    return { id: v.id, kind: "crowd", level: v.level, createdAt: v.createdAt };
  }
  if (v.kind === "equipment" && typeof v.equipmentId === "string" && v.equipmentId in EQUIPMENT_BY_ID && isNum(v.inUse)) {
    const eq = EQUIPMENT_BY_ID[v.equipmentId as keyof typeof EQUIPMENT_BY_ID];
    if (v.inUse < 0 || v.inUse > eq.total) return null;
    return { id: v.id, kind: "equipment", equipmentId: eq.id, inUse: Math.round(v.inUse), createdAt: v.createdAt };
  }
  return null;
}

function sanitizeFeedback(v: unknown): FeedbackEntry | null {
  if (!isObj(v) || typeof v.id !== "string" || !isNum(v.createdAt)) return null;
  if (v.answer !== "yes" && v.answer !== "maybe" && v.answer !== "no") return null;
  return { id: v.id, answer: v.answer, comment: typeof v.comment === "string" ? v.comment : "", createdAt: v.createdAt };
}

const keep = <T,>(items: unknown, fn: (v: unknown) => T | null): T[] =>
  Array.isArray(items) ? items.map(fn).filter((x): x is T => x !== null) : [];

export function parseState(raw: string | null): PersistedState {
  const base = defaultState();
  if (!raw) return base;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isObj(data) || data.version !== 1) return base;
    const profile = isObj(data.profile) ? data.profile : {};
    const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim().slice(0, 40) : DEFAULT_NAME;
    return {
      version: 1,
      profile: { name, onboarded: profile.onboarded === true },
      preferences: sanitizePreferences(data.preferences),
      plans: keep(data.plans, sanitizePlan),
      reports: keep(data.reports, sanitizeReport),
      feedback: keep(data.feedback, sanitizeFeedback),
    };
  } catch {
    return base;
  }
}

// ---- external store -------------------------------------------------------

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: PersistedState | null = null;
let memoryOnly = false;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    memoryOnly = true;
    return null;
  }
}

export function getSnapshot(): PersistedState {
  if (memoryOnly && cachedState) return cachedState;
  const raw = readRaw();
  if (cachedState && raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  cachedState = parseState(raw);
  return cachedState;
}

export function getServerSnapshot(): PersistedState | null {
  return null;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateState(fn: (state: PersistedState) => PersistedState): void {
  const next = fn(getSnapshot());
  cachedState = next;
  try {
    const raw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
  } catch {
    memoryOnly = true;
  }
  listeners.forEach((l) => l());
}

export function resetState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore; in-memory reset below still applies
  }
  cachedRaw = null;
  cachedState = defaultState();
  listeners.forEach((l) => l());
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
