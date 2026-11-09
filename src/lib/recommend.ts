/**
 * Best-time recommendation:
 * 1. Candidate sessions start every 30 minutes inside the user's window and gym hours.
 * 2. Each session is scored by the average forecast utilization of the workout's
 *    relevant equipment across its full duration (slots weighted by overlap).
 * 3. The lowest score wins; ties go to the earlier session.
 */
import { EQUIPMENT_BY_ID, GYM, SLOT_MINUTES, WORKOUT_BY_ID } from "./config";
import { type ForecastFn, averageUtilization, demoForecast, gymHours, slotStartFor } from "./forecast";
import { addDays, formatDuration, formatRange, formatTime, longWeekday } from "./time";
import type { DateKey, Duration, EquipmentId, Minutes, WorkoutId } from "./types";

export interface RecommendationInput {
  workout: WorkoutId;
  date: DateKey;
  earliest: Minutes;
  latest: Minutes;
  duration: Duration;
}

export interface RecommendOptions {
  forecast?: ForecastFn;
  /** Today's date; when given, the input date must fall within the next seven days. */
  today?: DateKey;
  /** Sessions may not start before this minute (used for "today" so past times are skipped). */
  notBefore?: Minutes;
}

export interface Session {
  start: Minutes;
  end: Minutes;
  score: number;
  perEquipment: Partial<Record<EquipmentId, number>>;
}

export type PlannerField = "date" | "window" | "duration";

export interface ValidationIssue {
  field: PlannerField;
  message: string;
}

export interface RecommendationSuccess {
  ok: true;
  input: RecommendationInput;
  equipment: EquipmentId[];
  /** Window actually searched, after clipping to gym hours and the current time. */
  window: { start: Minutes; end: Minutes };
  best: Session;
  alternatives: Session[];
  eligible: Session[];
  averageScore: number;
  busiest: Session;
  /** Relative reduction of best vs the average eligible session, or null when not meaningful. */
  reductionVsAverage: number | null;
}

export interface RecommendationFailure {
  ok: false;
  input: RecommendationInput;
  issues: ValidationIssue[];
}

export type RecommendationResult = RecommendationSuccess | RecommendationFailure;

/** Utilization of each equipment and their average over [start, end), weighting slots by overlap. */
export function scoreSession(
  equipment: EquipmentId[],
  date: DateKey,
  start: Minutes,
  end: Minutes,
  forecast: ForecastFn = demoForecast,
): Session {
  const perEquipment: Partial<Record<EquipmentId, number>> = {};
  for (const id of equipment) {
    let weighted = 0;
    for (let slot = slotStartFor(start); slot < end; slot += SLOT_MINUTES) {
      const overlap = Math.min(end, slot + SLOT_MINUTES) - Math.max(start, slot);
      if (overlap > 0) weighted += forecast(id, date, slot) * overlap;
    }
    perEquipment[id] = weighted / (end - start);
  }
  const values = equipment.map((id) => perEquipment[id] ?? 0);
  const score = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  return { start, end, score, perEquipment };
}

const overlaps = (a: Session, b: Session) => a.start < b.end && b.start < a.end;

/** Ascending score, then earlier start. */
const compareSessions = (a: Session, b: Session) => a.score - b.score || a.start - b.start;

export function recommend(input: RecommendationInput, options: RecommendOptions = {}): RecommendationResult {
  const forecast = options.forecast ?? demoForecast;
  const { date, earliest, latest, duration } = input;
  const issues: ValidationIssue[] = [];

  if (options.today) {
    const last = addDays(options.today, 6);
    if (date < options.today || date > last) {
      issues.push({ field: "date", message: "Choose a date within the next seven days." });
    }
  }
  if (latest <= earliest) {
    issues.push({ field: "window", message: "Latest finish must be later than earliest arrival." });
  } else if (latest - earliest < duration) {
    issues.push({
      field: "window",
      message: `Your window is ${formatDuration(latest - earliest)}, but this workout needs ${formatDuration(
        duration,
      )}. Widen your hours or pick a shorter duration.`,
    });
  }
  if (issues.length) return { ok: false, input, issues };

  const hours = gymHours(date);
  const notBefore = options.notBefore === undefined ? 0 : Math.ceil(options.notBefore / SLOT_MINUTES) * SLOT_MINUTES;
  const windowStart = Math.max(earliest, hours.open, notBefore);
  const windowEnd = Math.min(latest, hours.close);
  const firstStart = Math.ceil(windowStart / SLOT_MINUTES) * SLOT_MINUTES;

  const equipment = WORKOUT_BY_ID[input.workout].equipment;
  const eligible: Session[] = [];
  for (let start = firstStart; start + duration <= windowEnd; start += SLOT_MINUTES) {
    eligible.push(scoreSession(equipment, date, start, start + duration, forecast));
  }

  if (eligible.length === 0) {
    // Would have fit if the window hadn't already started.
    const pastToday = notBefore > 0 && Math.max(earliest, hours.open) + duration <= windowEnd;
    const message = pastToday
      ? `It's too late today for a ${formatDuration(duration)} session in that window. Choose later hours or another day.`
      : `${GYM.shortName} is open ${formatRange(hours.open, hours.close)} on ${longWeekday(date)}. No ${formatDuration(
          duration,
        )} session fits between ${formatTime(earliest)} and ${formatTime(latest)} within those hours — adjust your times, date, or duration.`;
    return { ok: false, input, issues: [{ field: "window", message }] };
  }

  const ranked = [...eligible].sort(compareSessions);
  const best = ranked[0];

  // Prefer alternatives that don't overlap the best session or each other.
  const alternatives: Session[] = [];
  for (const s of ranked.slice(1)) {
    if (alternatives.length === 2) break;
    if (!overlaps(s, best) && alternatives.every((a) => !overlaps(a, s))) alternatives.push(s);
  }
  for (const s of ranked.slice(1)) {
    if (alternatives.length === 2) break;
    if (!alternatives.includes(s)) alternatives.push(s);
  }
  alternatives.sort((a, b) => a.start - b.start);

  const averageScore = eligible.reduce((sum, s) => sum + s.score, 0) / eligible.length;
  const busiest = ranked[ranked.length - 1];
  const reduction = averageScore > 0 ? (averageScore - best.score) / averageScore : 0;

  return {
    ok: true,
    input,
    equipment,
    window: { start: firstStart, end: windowEnd },
    best,
    alternatives,
    eligible,
    averageScore,
    busiest,
    reductionVsAverage: eligible.length >= 2 && reduction >= 0.01 ? reduction : null,
  };
}

const pct = (u: number) => `${Math.round(u * 100)}%`;

/** Headline comparison; only states a percentage that was computed from eligible sessions. */
export function comparisonText(result: RecommendationSuccess): string {
  if (result.reductionVsAverage === null) {
    return result.eligible.length === 1
      ? "The only session that fits your available window."
      : "Lowest predicted equipment demand in your available window.";
  }
  return `${Math.round(result.reductionVsAverage * 100)}% lower predicted equipment demand than the average time in your window`;
}

/** "Why this time?" bullet points, built from the same session scores shown in the chart. */
export function explainRecommendation(result: RecommendationSuccess): string[] {
  const { best, busiest, equipment, input } = result;
  const lines: string[] = [];
  const names = equipment.map((id) => EQUIPMENT_BY_ID[id].name.toLowerCase());

  if (result.eligible.length > 1 && busiest.score > best.score) {
    const detail = equipment
      .map((id) => `${EQUIPMENT_BY_ID[id].name.toLowerCase()} ~${pct(best.perEquipment[id] ?? 0)}`)
      .join(", ");
    lines.push(
      `Predicted use: ${detail}, vs ${pct(busiest.score)} on average at the busiest option (${formatRange(
        busiest.start,
        busiest.end,
      )}).`,
    );
  } else {
    lines.push(`Predicted use of ${joinList(names)} averages ~${pct(best.score)} during this session.`);
  }
  lines.push(
    `Fits your ${formatRange(input.earliest, input.latest)} window with the full ${formatDuration(input.duration)}.`,
  );
  lines.push(`Scored for your ${WORKOUT_BY_ID[input.workout].name} workout using ${joinList(names)}.`);
  return lines;
}

export interface SessionChartPoint {
  start: Minutes;
  utilization: number;
  inSession: boolean;
}

/** 30-minute forecast of the relevant equipment across the searched window. */
export function sessionChartData(result: RecommendationSuccess, forecast: ForecastFn = demoForecast): SessionChartPoint[] {
  const points: SessionChartPoint[] = [];
  for (let s = result.window.start; s < result.window.end; s += SLOT_MINUTES) {
    points.push({
      start: s,
      utilization: averageUtilization(result.equipment, result.input.date, s, forecast),
      inSession: s >= slotStartFor(result.best.start) && s < result.best.end,
    });
  }
  return points;
}

export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
