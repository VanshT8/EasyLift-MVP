import { minutesOfDay, toDateKey } from "./time";
import type { SavedPlan } from "./types";

/** Plans that haven't finished yet, soonest first. */
export function upcomingPlans(plans: SavedPlan[], now: number): SavedPlan[] {
  const today = toDateKey(new Date(now));
  const minute = minutesOfDay(now);
  return plans
    .filter((p) => p.date > today || (p.date === today && p.end > minute))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
}
