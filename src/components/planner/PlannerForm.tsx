"use client";

import { Search } from "lucide-react";
import { useId } from "react";
import { updatePreferences } from "@/lib/actions";
import { DURATIONS, EQUIPMENT_BY_ID, WORKOUTS, WORKOUT_BY_ID } from "@/lib/config";
import type { ValidationIssue } from "@/lib/recommend";
import { formatDate, formatRelativeDate, formatTime, nextSevenDays } from "@/lib/time";
import type { DateKey, Duration, PlannerPreferences } from "@/lib/types";
import { EQUIPMENT_ICON, WORKOUT_ICON } from "../icons";
import { Button, Card, cx } from "../ui";

const ARRIVALS = Array.from({ length: 38 }, (_, i) => 5 * 60 + i * 30); // 5:00 AM – 11:30 PM
const FINISHES = Array.from({ length: 38 }, (_, i) => 5 * 60 + 30 + i * 30); // 5:30 AM – 12:00 AM

function dateOptionLabel(d: DateKey, today: DateKey) {
  const relative = formatRelativeDate(d, today);
  return relative === formatDate(d) ? relative : `${relative} · ${formatDate(d)}`;
}

const selectClass =
  "h-11 w-full rounded-xl border border-line-strong bg-surface-2 px-3 text-sm aria-[invalid=true]:border-bad/70";

export function PlannerForm({
  preferences: p,
  today,
  issues,
  onFind,
}: {
  preferences: PlannerPreferences;
  today: DateKey;
  issues: ValidationIssue[];
  onFind: () => void;
}) {
  const ids = { date: useId(), earliest: useId(), latest: useId(), windowError: useId(), dateError: useId() };
  const windowIssue = issues.find((i) => i.field === "window");
  const dateIssue = issues.find((i) => i.field === "date");
  const relevant = WORKOUT_BY_ID[p.workout].equipment;

  return (
    <form
      id="planner-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onFind();
      }}
      className="space-y-4"
    >
      <Card aria-labelledby="choose-workout">
        <h2 id="choose-workout" className="mb-3 font-semibold">
          1. Choose workout
        </h2>
        <div role="group" aria-labelledby="choose-workout" className="grid grid-cols-3 gap-2">
          {WORKOUTS.map((w) => {
            const Icon = WORKOUT_ICON[w.id];
            const selected = p.workout === w.id;
            return (
              <button
                key={w.id}
                type="button"
                aria-pressed={selected}
                onClick={() => updatePreferences({ workout: w.id })}
                className={cx(
                  "flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors",
                  selected
                    ? "border-brand bg-brand/15 text-ink ring-1 ring-brand"
                    : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
                )}
              >
                <Icon className={cx("size-6", selected && "text-brand-soft")} aria-hidden="true" />
                {w.name}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-subtle">Equipment this workout needs</p>
          <ul className="flex flex-wrap gap-2">
            {relevant.map((id) => {
              const Icon = EQUIPMENT_ICON[id];
              return (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-good/12 px-3 py-1 text-xs font-semibold text-good-ink ring-1 ring-inset ring-good/30"
                >
                  <Icon className="size-3.5" />
                  {EQUIPMENT_BY_ID[id].name}
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      <Card aria-labelledby="your-time">
        <h2 id="your-time" className="mb-3 font-semibold">
          2. Your available time
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor={ids.date} className="mb-1.5 block text-sm font-medium">
              Date
            </label>
            <select
              id={ids.date}
              value={p.date}
              onChange={(e) => updatePreferences({ date: e.target.value })}
              aria-invalid={dateIssue ? true : undefined}
              aria-describedby={dateIssue ? ids.dateError : undefined}
              className={selectClass}
            >
              {nextSevenDays(today).map((d) => (
                <option key={d} value={d}>
                  {dateOptionLabel(d, today)}
                </option>
              ))}
            </select>
            {dateIssue && (
              <p id={ids.dateError} className="mt-1.5 text-sm text-bad-ink">
                {dateIssue.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={ids.earliest} className="mb-1.5 block text-sm font-medium">
                Earliest arrival
              </label>
              <select
                id={ids.earliest}
                value={p.earliest}
                onChange={(e) => updatePreferences({ earliest: Number(e.target.value) })}
                aria-invalid={windowIssue ? true : undefined}
                aria-describedby={windowIssue ? ids.windowError : undefined}
                className={selectClass}
              >
                {ARRIVALS.map((m) => (
                  <option key={m} value={m}>
                    {formatTime(m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.latest} className="mb-1.5 block text-sm font-medium">
                Latest finish
              </label>
              <select
                id={ids.latest}
                value={p.latest}
                onChange={(e) => updatePreferences({ latest: Number(e.target.value) })}
                aria-invalid={windowIssue ? true : undefined}
                aria-describedby={windowIssue ? ids.windowError : undefined}
                className={selectClass}
              >
                {FINISHES.map((m) => (
                  <option key={m} value={m}>
                    {m === 1440 ? "12:00 AM (midnight)" : formatTime(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Workout duration</legend>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <label
                  key={d}
                  className={cx(
                    "flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-soft",
                    p.duration === d
                      ? "border-brand bg-brand/15 text-ink"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={d}
                    checked={p.duration === d}
                    onChange={() => updatePreferences({ duration: d as Duration })}
                    className="sr-only"
                  />
                  {d} min
                </label>
              ))}
            </div>
          </fieldset>

          {windowIssue && (
            <p id={ids.windowError} role="alert" className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-bad-ink">
              {windowIssue.message}
            </p>
          )}
        </div>
      </Card>

      <div className="sticky bottom-20 z-10 lg:static">
        <Button type="submit" size="lg" className="w-full">
          <Search className="size-5" aria-hidden="true" />
          Find Best Time
        </Button>
      </div>
    </form>
  );
}
