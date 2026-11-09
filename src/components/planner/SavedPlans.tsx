"use client";

import { CalendarClock, Trash } from "lucide-react";
import { removePlan } from "@/lib/actions";
import { EQUIPMENT_BY_ID, WORKOUT_BY_ID } from "@/lib/config";
import { formatRange, formatRelativeDate } from "@/lib/time";
import type { DateKey, SavedPlan } from "@/lib/types";
import { useAppUI } from "../AppUI";
import { WORKOUT_ICON } from "../icons";
import { Card } from "../ui";

export function SavedPlans({ plans, today }: { plans: SavedPlan[]; today: DateKey }) {
  const { toast } = useAppUI();
  return (
    <Card aria-labelledby="saved-plans-title" id="saved-plans" className="scroll-mt-20">
      <h2 id="saved-plans-title" className="mb-3 font-semibold">
        Upcoming plans
      </h2>
      {plans.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong px-4 py-8 text-center">
          <CalendarClock className="mb-2 size-8 text-subtle" aria-hidden="true" />
          <p className="font-medium">No workouts planned yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Find your best time above, then tap <span className="text-ink">Add to My Plan</span>. Saved sessions appear here
            and on your dashboard.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {plans.map((p) => {
            const Icon = WORKOUT_ICON[p.workout];
            const label = `${WORKOUT_BY_ID[p.workout].name}, ${formatRelativeDate(p.date, today)} ${formatRange(p.start, p.end)}`;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand-soft">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {WORKOUT_BY_ID[p.workout].name} · {formatRelativeDate(p.date, today)}
                  </p>
                  <p className="text-xs text-muted">{formatRange(p.start, p.end)}</p>
                  <p className="truncate text-xs text-subtle">
                    {p.equipment.map((id) => EQUIPMENT_BY_ID[id].name).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removePlan(p.id);
                    toast("Plan removed");
                  }}
                  aria-label={`Remove plan: ${label}`}
                  className="rounded-lg p-2 text-muted hover:bg-bad/15 hover:text-bad-ink"
                >
                  <Trash className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
