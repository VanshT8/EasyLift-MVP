import { DEFAULT_NAME } from "./config";
import { newId, resetState, updateState } from "./storage";
import type { ConditionReport, FeedbackAnswer, PlannerPreferences, SavedPlan } from "./types";

const cleanName = (name: string) => name.trim().slice(0, 40) || DEFAULT_NAME;

export function completeOnboarding(name: string) {
  updateState((s) => ({ ...s, profile: { name: cleanName(name), onboarded: true } }));
}

export function setName(name: string) {
  updateState((s) => ({ ...s, profile: { ...s.profile, name: cleanName(name) } }));
}

export function updatePreferences(patch: Partial<PlannerPreferences>) {
  updateState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
}

export const isSamePlan = (a: Omit<SavedPlan, "id" | "createdAt">, b: Omit<SavedPlan, "id" | "createdAt">) =>
  a.workout === b.workout && a.date === b.date && a.start === b.start && a.end === b.end;

/** Returns false when an identical plan already exists. */
export function savePlan(plan: Omit<SavedPlan, "id" | "createdAt">): boolean {
  let saved = false;
  updateState((s) => {
    if (s.plans.some((p) => isSamePlan(p, plan))) return s;
    saved = true;
    return { ...s, plans: [...s.plans, { ...plan, id: newId(), createdAt: Date.now() }] };
  });
  return saved;
}

export function removePlan(id: string) {
  updateState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) }));
}

type NewReport =
  | { kind: "crowd"; level: Extract<ConditionReport, { kind: "crowd" }>["level"] }
  | { kind: "equipment"; equipmentId: Extract<ConditionReport, { kind: "equipment" }>["equipmentId"]; inUse: number };

export function addReport(report: NewReport) {
  const entry = { ...report, id: newId(), createdAt: Date.now() } as ConditionReport;
  // Keep the most recent 50 so storage stays small.
  updateState((s) => ({ ...s, reports: [...s.reports, entry].slice(-50) }));
}

export function addFeedback(answer: FeedbackAnswer, comment: string) {
  updateState((s) => ({
    ...s,
    feedback: [...s.feedback, { id: newId(), answer, comment: comment.trim().slice(0, 1000), createdAt: Date.now() }],
  }));
}

export { resetState };
