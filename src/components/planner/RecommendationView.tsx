"use client";

import { CalendarPlus, Check, CircleCheck, SlidersHorizontal, TrendingDown } from "lucide-react";
import { isSamePlan, savePlan } from "@/lib/actions";
import { EQUIPMENT_BY_ID, WORKOUT_BY_ID } from "@/lib/config";
import {
  type RecommendationSuccess,
  type Session,
  comparisonText,
  explainRecommendation,
  joinList,
  sessionChartData,
} from "@/lib/recommend";
import { formatDate, formatRange, formatTime } from "@/lib/time";
import type { SavedPlan } from "@/lib/types";
import { useAppUI } from "../AppUI";
import { ChartLegend, ForecastBars } from "../charts/ForecastBars";
import { Button, Card, buttonClass, cx } from "../ui";

const SESSION_COLOR = "#22c55e";
const WINDOW_COLOR = "#2f7cf6";
const pct = (u: number) => `${Math.round(u * 100)}%`;

export function RecommendationView({
  result,
  plans,
  onEdit,
}: {
  result: RecommendationSuccess;
  plans: SavedPlan[];
  onEdit: () => void;
}) {
  const { toast } = useAppUI();
  const { input, best } = result;
  const workout = WORKOUT_BY_ID[input.workout];
  const equipmentNames = result.equipment.map((id) => EQUIPMENT_BY_ID[id].name.toLowerCase());

  const planFor = (s: Session) => ({ workout: input.workout, date: input.date, start: s.start, end: s.end, equipment: result.equipment });
  const isSaved = (s: Session) => plans.some((p) => isSamePlan(p, planFor(s)));
  const save = (s: Session) => {
    const saved = savePlan(planFor(s));
    toast(saved ? `Added ${workout.name} · ${formatRange(s.start, s.end)} to your plan` : "That session is already in your plan");
  };

  const chart = sessionChartData(result);
  const bestSaved = isSaved(best);

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="best-time"
        className="rounded-2xl border border-good/50 bg-gradient-to-br from-good/15 to-surface p-5 sm:p-6"
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-good-ink">
          <CircleCheck className="size-5" aria-hidden="true" />
          Best time for {workout.name} · {formatDate(input.date)}
        </p>
        <h2 id="best-time" className="mt-2 text-3xl font-bold tracking-tight">
          {formatRange(best.start, best.end)}
        </h2>
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
          <TrendingDown className="mt-0.5 size-4 shrink-0 text-good-ink" aria-hidden="true" />
          <span>
            {comparisonText(result)}. Predicted use ~{pct(best.score)}.
          </span>
        </p>
      </section>

      <Card aria-labelledby="session-forecast">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="session-forecast" className="font-semibold">
            Forecast · {joinList(result.equipment.map((id) => EQUIPMENT_BY_ID[id].name))}
          </h3>
          <ChartLegend
            items={[
              { color: SESSION_COLOR, label: "Recommended" },
              { color: WINDOW_COLOR, label: "Other times" },
            ]}
          />
        </div>
        <ForecastBars
          data={chart.map((p) => ({
            start: p.start,
            utilization: p.utilization,
            color: p.inSession ? SESSION_COLOR : WINDOW_COLOR,
            note: p.inSession ? "Recommended session" : "In your window",
          }))}
          height={190}
          tickEvery={chart.length > 12 ? 4 : 2}
          summary={`Average predicted use of ${joinList(equipmentNames)} in 30-minute steps from ${formatTime(
            result.window.start,
          )} to ${formatTime(result.window.end)}. The recommended ${formatRange(best.start, best.end)} session averages ${pct(
            best.score,
          )}; the busiest option (${formatRange(result.busiest.start, result.busiest.end)}) averages ${pct(result.busiest.score)}.`}
        />
      </Card>

      <Card aria-labelledby="why-title">
        <h3 id="why-title" className="mb-3 font-semibold">
          Why this time?
        </h3>
        <ul className="space-y-2.5">
          {explainRecommendation(result).map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-good-ink" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      {result.alternatives.length > 0 && (
        <Card aria-labelledby="alt-title">
          <h3 id="alt-title" className="mb-3 font-semibold">
            Alternative times
          </h3>
          <ul className="space-y-2">
            {result.alternatives.map((s) => {
              const saved = isSaved(s);
              return (
                <li key={s.start} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{formatRange(s.start, s.end)}</p>
                    <p className="text-xs text-muted">
                      ~{pct(s.score)} predicted use · +{Math.max(0, Math.round((s.score - best.score) * 100))} pts vs best
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => save(s)}
                    disabled={saved}
                    aria-label={saved ? `${formatRange(s.start, s.end)} saved` : `Save ${formatRange(s.start, s.end)} to my plan`}
                    className={buttonClass("ghost", "sm")}
                  >
                    {saved ? <Check className="size-4" aria-hidden="true" /> : <CalendarPlus className="size-4" aria-hidden="true" />}
                    {saved ? "Saved" : "Save"}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" onClick={() => save(best)} disabled={bestSaved} className={cx(bestSaved && "bg-[#15803d]! disabled:opacity-100")}>
          {bestSaved ? <Check className="size-5" aria-hidden="true" /> : <CalendarPlus className="size-5" aria-hidden="true" />}
          {bestSaved ? "Added to My Plan" : "Add to My Plan"}
        </Button>
        <Button size="lg" variant="secondary" onClick={onEdit}>
          <SlidersHorizontal className="size-5" aria-hidden="true" />
          Edit Preferences
        </Button>
      </div>
    </div>
  );
}
