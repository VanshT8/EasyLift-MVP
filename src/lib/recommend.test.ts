import { describe, expect, it } from "vitest";
import { GYM_HOURS } from "./config";
import type { ForecastFn } from "./forecast";
import { gymHours } from "./forecast";
import { type RecommendationSuccess, comparisonText, recommend, scoreSession, sessionChartData } from "./recommend";
import { gymSnapshot } from "./snapshot";
import { weekday } from "./time";
import type { Duration, WorkoutId } from "./types";

// 2026-03-10 is a Tuesday (open 6:00 AM – 11:00 PM in the demo).
const TUESDAY = "2026-03-10";
const SATURDAY = "2026-03-14";

function ok(result: ReturnType<typeof recommend>): RecommendationSuccess {
  if (!result.ok) throw new Error(result.issues.map((i) => i.message).join("; "));
  return result;
}

describe("recommend: session validity", () => {
  const cases: { workout: WorkoutId; date: string; earliest: number; latest: number; duration: Duration }[] = [
    { workout: "legs", date: TUESDAY, earliest: 16 * 60, latest: 21 * 60, duration: 60 },
    { workout: "chest", date: TUESDAY, earliest: 5 * 60, latest: 24 * 60, duration: 90 },
    { workout: "full-body", date: SATURDAY, earliest: 6 * 60, latest: 22 * 60, duration: 45 },
    { workout: "arms", date: SATURDAY, earliest: 18 * 60 + 30, latest: 20 * 60, duration: 90 },
  ];

  it.each(cases)("fits the window and gym hours for $workout on $date", (input) => {
    const result = ok(recommend(input));
    const hours = gymHours(input.date);
    for (const s of [result.best, ...result.alternatives]) {
      expect(s.end - s.start).toBe(input.duration);
      expect(s.start).toBeGreaterThanOrEqual(Math.max(input.earliest, hours.open));
      expect(s.end).toBeLessThanOrEqual(Math.min(input.latest, hours.close));
      expect(s.start % 30).toBe(0);
    }
  });

  it("picks the lowest-scoring eligible session and alternatives are distinct", () => {
    const result = ok(recommend({ workout: "legs", date: TUESDAY, earliest: 6 * 60, latest: 23 * 60, duration: 60 }));
    const min = Math.min(...result.eligible.map((s) => s.score));
    expect(result.best.score).toBe(min);
    expect(result.alternatives).toHaveLength(2);
    expect(new Set([result.best.start, ...result.alternatives.map((a) => a.start)]).size).toBe(3);
  });

  it("rejects windows shorter than the workout or outside opening hours", () => {
    const short = recommend({ workout: "legs", date: TUESDAY, earliest: 17 * 60, latest: 18 * 60, duration: 90 });
    expect(short.ok).toBe(false);

    // Saturday closes at 8 PM.
    const closed = recommend({ workout: "legs", date: SATURDAY, earliest: 20 * 60, latest: 23 * 60, duration: 60 });
    expect(closed.ok).toBe(false);
    if (!closed.ok) expect(closed.issues[0].message).toMatch(/open/);

    const inverted = recommend({ workout: "legs", date: TUESDAY, earliest: 19 * 60, latest: 18 * 60, duration: 45 });
    expect(inverted.ok).toBe(false);
  });

  it("skips times that have already passed today and rejects dates beyond a week", () => {
    const today = ok(
      recommend(
        { workout: "back", date: TUESDAY, earliest: 6 * 60, latest: 23 * 60, duration: 60 },
        { today: TUESDAY, notBefore: 19 * 60 + 10 },
      ),
    );
    expect(today.best.start).toBeGreaterThanOrEqual(19 * 60 + 30);

    const far = recommend(
      { workout: "back", date: "2026-03-20", earliest: 6 * 60, latest: 23 * 60, duration: 60 },
      { today: TUESDAY },
    );
    expect(far.ok).toBe(false);
  });
});

describe("recommend: duration and scoring", () => {
  it("weights partial slots so a 45-minute session covers exactly 45 minutes", () => {
    // 0.2 in the 5:00 slot, 0.8 in the 5:30 slot → (30·0.2 + 15·0.8) / 45 = 0.4
    const forecast: ForecastFn = (_id, _date, slot) => (slot === 17 * 60 ? 0.2 : 0.8);
    const s = scoreSession(["squat-rack"], TUESDAY, 17 * 60, 17 * 60 + 45, forecast);
    expect(s.score).toBeCloseTo(0.4, 10);
  });

  it("scores only the equipment relevant to the workout", () => {
    // Squat racks are packed 5–6 PM while benches are empty; the reverse at 7–8 PM.
    const forecast: ForecastFn = (id, _date, slot) => {
      const fivePm = slot >= 17 * 60 && slot < 18 * 60;
      const sevenPm = slot >= 19 * 60 && slot < 20 * 60;
      if (id === "squat-rack" || id === "leg-press") return fivePm ? 0.95 : sevenPm ? 0.1 : 0.5;
      if (id === "bench-press" || id === "cable") return fivePm ? 0.1 : sevenPm ? 0.95 : 0.5;
      return 0.5;
    };
    const base = { date: TUESDAY, earliest: 17 * 60, latest: 21 * 60, duration: 60 as const };
    expect(ok(recommend({ ...base, workout: "legs" }, { forecast })).best.start).toBe(19 * 60);
    expect(ok(recommend({ ...base, workout: "chest" }, { forecast })).best.start).toBe(17 * 60);
  });

  it("breaks ties by choosing the earlier session and avoids made-up percentages", () => {
    const flat: ForecastFn = () => 0.42;
    const result = ok(
      recommend({ workout: "legs", date: TUESDAY, earliest: 16 * 60, latest: 21 * 60, duration: 60 }, { forecast: flat }),
    );
    expect(result.best.start).toBe(16 * 60);
    expect(result.reductionVsAverage).toBeNull();
    expect(comparisonText(result)).not.toMatch(/%/);
  });

  it("chart highlights exactly the recommended session's slots", () => {
    const result = ok(recommend({ workout: "legs", date: TUESDAY, earliest: 16 * 60, latest: 21 * 60, duration: 90 }));
    const highlighted = sessionChartData(result).filter((p) => p.inSession);
    expect(highlighted).toHaveLength(3);
    expect(highlighted[0].start).toBe(result.best.start);
  });
});

describe("snapshot", () => {
  it("keeps counts, percentages, and waits consistent", () => {
    const now = new Date(2026, 2, 10, 18, 10).getTime();
    expect(GYM_HOURS[weekday(TUESDAY)].open).toBe(360);
    const snap = gymSnapshot(now, [{ id: "r", kind: "equipment", equipmentId: "squat-rack", inUse: 3, createdAt: now - 60_000 }]);
    const rack = snap.equipment.find((e) => e.id === "squat-rack")!;
    expect(rack).toMatchObject({ inUse: 3, available: 3, utilization: 0.5, waitMinutes: 0, source: "report" });
    for (const e of snap.equipment) {
      expect(e.inUse + e.available).toBe(e.total);
      if (e.available > 0) expect(e.waitMinutes).toBe(0);
    }
  });

  it("applies a report made seconds after the minute-rounded clock and shows a wait when full", () => {
    const now = new Date(2026, 2, 10, 18, 10).getTime();
    const snap = gymSnapshot(now, [{ id: "r", kind: "equipment", equipmentId: "leg-press", inUse: 4, createdAt: now + 8_000 }]);
    const press = snap.equipment.find((e) => e.id === "leg-press")!;
    expect(press).toMatchObject({ inUse: 4, available: 0, source: "report" });
    expect(press.waitMinutes).toBeGreaterThan(0);
  });
});
