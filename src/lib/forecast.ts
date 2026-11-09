/**
 * Deterministic, simulated equipment demand. Nothing here is measured; it is a
 * hand-tuned model of a typical campus gym so the demo behaves believably.
 * The same inputs always produce the same numbers.
 */
import { EQUIPMENT, GYM_HOURS, SLOT_MINUTES, levelForUtilization } from "./config";
import { weekday } from "./time";
import type { CrowdLevel, DateKey, EquipmentId, Minutes } from "./types";

/** Utilization (0–1) for one equipment category in one 30-minute slot. */
export type ForecastFn = (equipmentId: EquipmentId, date: DateKey, slotStart: Minutes) => number;

export function gymHours(date: DateKey): { open: Minutes; close: Minutes } {
  return GYM_HOURS[weekday(date)];
}

export function isOpen(date: DateKey, minute: Minutes): boolean {
  const { open, close } = gymHours(date);
  return minute >= open && minute < close;
}

export function slotStartFor(minute: Minutes): Minutes {
  return Math.floor(minute / SLOT_MINUTES) * SLOT_MINUTES;
}

/** Start times of every 30-minute slot the gym is open on a date. */
export function openSlots(date: DateKey): Minutes[] {
  const { open, close } = gymHours(date);
  const slots: Minutes[] = [];
  for (let m = open; m < close; m += SLOT_MINUTES) slots.push(m);
  return slots;
}

/** Small FNV-1a hash → [0, 1). Gives each slot stable "noise". */
function hash01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

const bump = (t: number, center: number, width: number, height: number) =>
  height * Math.exp(-((t - center) ** 2) / (2 * width ** 2));

/** Overall gym traffic shape for a weekday, before equipment-specific tweaks. */
function baseCurve(day: number, t: Minutes): number {
  const weekend = day === 0 || day === 6;
  if (weekend) {
    return 0.12 + bump(t, 11.5 * 60, 110, 0.48) + bump(t, 15.5 * 60, 80, 0.22);
  }
  return 0.1 + bump(t, 7.5 * 60, 55, 0.32) + bump(t, 12.5 * 60, 50, 0.22) + bump(t, 18 * 60, 85, 0.58);
}

const DAY_FACTOR = [0.78, 1.08, 1.0, 1.04, 0.96, 0.8, 0.88];

interface EquipmentProfile {
  scale: number;
  /** Extra demand on particular weekdays (0 = Sunday). */
  dayBias?: Partial<Record<number, number>>;
  /** Extra demand around a time of day. */
  timeBias?: { center: Minutes; width: number; height: number };
}

const PROFILE: Record<EquipmentId, EquipmentProfile> = {
  "squat-rack": { scale: 1.05, dayBias: { 1: 0.06, 3: 0.08, 2: -0.04 } },
  "leg-press": { scale: 0.95, dayBias: { 3: 0.06, 5: -0.04 } },
  "bench-press": { scale: 1.05, dayBias: { 1: 0.14, 4: 0.03 } },
  cable: { scale: 0.95, dayBias: { 2: 0.05, 4: 0.05 } },
  dumbbell: { scale: 0.88, dayBias: { 2: 0.03 } },
  treadmill: { scale: 0.85, timeBias: { center: 7 * 60, width: 60, height: 0.22 } },
};

export const demoForecast: ForecastFn = (equipmentId, date, slotStart) => {
  if (!isOpen(date, slotStart)) return 0;
  const day = weekday(date);
  const profile = PROFILE[equipmentId];
  const t = slotStart + SLOT_MINUTES / 2;
  let u = baseCurve(day, t) * DAY_FACTOR[day] * profile.scale;
  u += profile.dayBias?.[day] ?? 0;
  if (profile.timeBias) u += bump(t, profile.timeBias.center, profile.timeBias.width, profile.timeBias.height);
  u += (hash01(`${equipmentId}|${date}|${slotStart}`) - 0.5) * 0.12;
  return Math.min(0.97, Math.max(0.04, u));
};

/** Average utilization of several equipment categories in one slot. */
export function averageUtilization(
  equipment: EquipmentId[],
  date: DateKey,
  slotStart: Minutes,
  forecast: ForecastFn = demoForecast,
): number {
  if (equipment.length === 0) return 0;
  return equipment.reduce((sum, id) => sum + forecast(id, date, slotStart), 0) / equipment.length;
}

export interface SlotPoint {
  start: Minutes;
  utilization: number;
  level: CrowdLevel;
}

/** Hourly forecast (averaged from 30-min slots) for a set of equipment on a date. */
export function hourlyForecast(
  equipment: EquipmentId[],
  date: DateKey,
  forecast: ForecastFn = demoForecast,
): SlotPoint[] {
  const { open, close } = gymHours(date);
  const points: SlotPoint[] = [];
  for (let h = open; h < close; h += 60) {
    const slots = [h, h + SLOT_MINUTES].filter((s) => s < close);
    const u = slots.reduce((sum, s) => sum + averageUtilization(equipment, date, s, forecast), 0) / slots.length;
    points.push({ start: h, utilization: u, level: levelForUtilization(u) });
  }
  return points;
}

export const hourlyGymForecast = (date: DateKey, forecast: ForecastFn = demoForecast) =>
  hourlyForecast(
    EQUIPMENT.map((e) => e.id),
    date,
    forecast,
  );

/** Text summary of a series for screen readers and chart captions. */
export function summarizeSeries(points: SlotPoint[], format: (m: Minutes) => string): string {
  if (points.length === 0) return "The gym is closed on this day.";
  let low = points[0];
  let high = points[0];
  for (const p of points) {
    if (p.utilization < low.utilization) low = p;
    if (p.utilization > high.utilization) high = p;
  }
  return `Busiest around ${format(high.start)} (${Math.round(high.utilization * 100)}%), quietest around ${format(
    low.start,
  )} (${Math.round(low.utilization * 100)}%).`;
}
