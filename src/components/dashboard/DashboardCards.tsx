"use client";

import { CalendarClock, ChevronRight, MessageSquareText, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePreferences } from "@/lib/actions";
import { EQUIPMENT_BY_ID, GYM, LEVEL_LABEL, WORKOUT_BY_ID } from "@/lib/config";
import { hourlyGymForecast, summarizeSeries } from "@/lib/forecast";
import { type RecommendationResult, comparisonText } from "@/lib/recommend";
import type { GymSnapshot } from "@/lib/snapshot";
import { formatAxisTime, formatDate, formatRange, formatRelativeDate, formatTimestamp, minutesOfDay } from "@/lib/time";
import type { DateKey, PlannerPreferences, SavedPlan } from "@/lib/types";
import { useAppUI } from "../AppUI";
import { ChartLegend, ForecastBars } from "../charts/ForecastBars";
import { LEVEL_LEGEND, levelBars } from "../charts/levelBars";
import { EQUIPMENT_ICON, WORKOUT_ICON } from "../icons";
import { Card, CardTitle, LEVEL_STYLES, UtilBar, buttonClass, cx, equipmentStatusLabel } from "../ui";

export function RecommendationCard({
  result,
  preferences,
  date,
  today,
}: {
  result: RecommendationResult;
  preferences: PlannerPreferences;
  date: DateKey;
  today: DateKey;
}) {
  const router = useRouter();
  const workout = WORKOUT_BY_ID[preferences.workout];
  const Icon = WORKOUT_ICON[workout.id];
  const open = () => {
    updatePreferences({ date, showResult: true });
    router.push("/plan");
  };

  return (
    <button
      type="button"
      onClick={open}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-brand/50 bg-gradient-to-br from-[#123068] via-[#0f2350] to-surface p-5 text-left shadow-xl shadow-blue-950/40 transition-colors hover:border-brand sm:p-6"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-brand-soft">
        <Sparkles className="size-4" aria-hidden="true" />
        Recommended time · {formatRelativeDate(date, today)}
      </span>
      {result.ok ? (
        <>
          <span className="mt-3 block text-2xl font-bold tracking-tight sm:text-3xl">
            {formatRange(result.best.start, result.best.end)}
          </span>
          <span className="mt-1 block text-sm text-blue-100/90">{comparisonText(result)}.</span>
        </>
      ) : (
        <>
          <span className="mt-3 block text-xl font-bold">No session fits your saved hours</span>
          <span className="mt-1 block text-sm text-blue-100/90">{result.issues[0]?.message}</span>
        </>
      )}
      <span className="mt-5 flex flex-wrap items-center gap-2 text-xs text-blue-100/80">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-medium text-white">
          <Icon className="size-3.5" aria-hidden="true" />
          {workout.name}
        </span>
        <span>
          {preferences.duration} min · window {formatRange(preferences.earliest, preferences.latest)}
        </span>
      </span>
      <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-white">
        {result.ok ? "See details & save" : "Adjust in planner"}
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  );
}

export function CrowdCard({ snapshot }: { snapshot: GymSnapshot }) {
  const { openReport } = useAppUI();
  return (
    <Card aria-labelledby="crowd-title">
      <CardTitle id="crowd-title" action={<span className="text-xs text-subtle">Today · right now</span>}>
        Gym crowd
      </CardTitle>
      {snapshot.open ? (
        <div className="flex items-center gap-4">
          <span className={cx("grid size-14 place-items-center rounded-2xl bg-surface-2", LEVEL_STYLES[snapshot.level].text)}>
            <Users className="size-7" aria-hidden="true" />
          </span>
          <div>
            <p className={cx("text-2xl font-bold", LEVEL_STYLES[snapshot.level].text)}>{LEVEL_LABEL[snapshot.level]}</p>
            <p className="text-sm text-muted">
              ~{snapshot.occupancy} of {GYM.capacity} people <span className="text-subtle">(sample)</span>
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-muted">Closed now</p>
          <p className="text-sm text-muted">Demo hours today: {formatRange(snapshot.hours.open, snapshot.hours.close)}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-subtle">
        Updated {formatTimestamp(snapshot.updatedAt)}
        {snapshot.levelSource === "report" && " · includes your report"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => openReport("crowd")} className={buttonClass("secondary", "sm")}>
          Report conditions
        </button>
      </div>
    </Card>
  );
}

export function EquipmentSummary({ snapshot }: { snapshot: GymSnapshot }) {
  return (
    <Card aria-labelledby="eq-summary-title">
      <CardTitle
        id="eq-summary-title"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-good/12 px-2.5 py-0.5 text-xs font-semibold text-good-ink ring-1 ring-inset ring-good/30">
            <span className="size-1.5 rounded-full bg-good" aria-hidden="true" />
            Today · {formatTimestamp(snapshot.updatedAt)}
          </span>
        }
      >
        Equipment right now
      </CardTitle>
      <ul className="-mx-2 divide-y divide-line">
        {snapshot.equipment.map((e) => {
          const Icon = EQUIPMENT_ICON[e.id];
          return (
            <li key={e.id}>
              <Link
                href={`/equipment?focus=${e.id}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-2 sm:grid-cols-[auto_1fr_8rem_4.5rem]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-muted">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{e.name}</span>
                  <span className="block text-xs text-muted">
                    <span className={LEVEL_STYLES[e.level].text}>{e.inUse}</span> / {e.total} in use ·{" "}
                    {equipmentStatusLabel(e.level, e.available)}
                  </span>
                </span>
                <span className="hidden sm:block">
                  <UtilBar value={e.utilization} level={e.level} label={`${e.name} utilization`} />
                </span>
                <span className="flex items-center justify-end gap-1 text-sm font-semibold tabular-nums">
                  <span className={LEVEL_STYLES[e.level].text}>{Math.round(e.utilization * 100)}%</span>
                  <ChevronRight className="size-4 text-subtle" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function HourlyForecastCard({ date, today, now }: { date: DateKey; today: DateKey; now: number }) {
  const points = hourlyGymForecast(date);
  const nowHour = Math.floor(minutesOfDay(now) / 60) * 60;
  const showNow = date === today && points.some((p) => p.start === nowHour);
  return (
    <Card aria-labelledby="forecast-title">
      <CardTitle id="forecast-title" action={<span className="text-xs text-subtle">Forecast · {formatDate(date)}</span>}>
        Hourly crowd forecast
      </CardTitle>
      <ForecastBars
        data={levelBars(points)}
        height={170}
        tickEvery={3}
        highlightStart={showNow ? nowHour : undefined}
        summary={`Whole-gym forecast for ${formatDate(date)}. ${summarizeSeries(points, formatAxisTime)}`}
      />
      <div className="mt-3">
        <ChartLegend items={LEVEL_LEGEND} />
      </div>
    </Card>
  );
}

export function NextWorkoutCard({ plan, today }: { plan: SavedPlan | undefined; today: DateKey }) {
  if (!plan) {
    return (
      <Card aria-labelledby="next-title">
        <CardTitle id="next-title">Next workout</CardTitle>
        <p className="text-sm text-muted">No upcoming workouts saved yet.</p>
        <Link href="/plan" className={buttonClass("secondary", "sm", "mt-3")}>
          <CalendarClock className="size-4" aria-hidden="true" />
          Plan a workout
        </Link>
      </Card>
    );
  }
  const Icon = WORKOUT_ICON[plan.workout];
  return (
    <Card aria-labelledby="next-title">
      <CardTitle
        id="next-title"
        action={
          <Link href="/plan#saved-plans" className="text-sm font-medium text-brand-soft hover:underline">
            All plans
          </Link>
        }
      >
        Next workout
      </CardTitle>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand-soft">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold">
            {WORKOUT_BY_ID[plan.workout].name} · {formatRelativeDate(plan.date, today)}
          </p>
          <p className="text-sm text-muted">{formatRange(plan.start, plan.end)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-subtle">
        Uses {plan.equipment.map((id) => EQUIPMENT_BY_ID[id].name.toLowerCase()).join(" & ")}
      </p>
    </Card>
  );
}

export function FeedbackPrompt() {
  const { openFeedback } = useAppUI();
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3">
      <p className="text-sm text-muted">Would you use EasyLift?</p>
      <button type="button" onClick={openFeedback} className={buttonClass("ghost", "sm", "shrink-0 whitespace-nowrap")}>
        <MessageSquareText className="size-4" aria-hidden="true" />
        Give feedback
      </button>
    </div>
  );
}
