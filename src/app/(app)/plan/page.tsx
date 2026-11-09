"use client";

import { ReadyGate } from "@/components/AppShell";
import { CalendarSearch, SearchX } from "lucide-react";
import { useRef } from "react";
import { PlannerForm } from "@/components/planner/PlannerForm";
import { RecommendationView } from "@/components/planner/RecommendationView";
import { SavedPlans } from "@/components/planner/SavedPlans";
import { Card, PageHeader } from "@/components/ui";
import { updatePreferences } from "@/lib/actions";
import { useAppData } from "@/lib/hooks";
import { upcomingPlans } from "@/lib/plans";
import { recommend } from "@/lib/recommend";
import { formatRange, minutesOfDay } from "@/lib/time";

export default function PlanPage() {
  return (
    <ReadyGate>
      <PlanView />
    </ReadyGate>
  );
}

function PlanView() {
  const { state, now, today, preferences } = useAppData();
  const resultRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Recomputed on every input change, so the result always reflects the current form.
  const result = recommend(preferences, {
    today,
    notBefore: preferences.date === today ? minutesOfDay(now) : undefined,
  });

  const find = () => {
    updatePreferences({ showResult: true, date: preferences.date });
    // Wait for the result to render, then bring it into view (matters on mobile where it stacks below).
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      resultRef.current?.focus({ preventScroll: true });
    });
  };

  const edit = () => {
    formTopRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    formTopRef.current?.querySelector<HTMLButtonElement>("button[aria-pressed='true']")?.focus({ preventScroll: true });
  };

  return (
    <div>
      <PageHeader title="Plan workout" subtitle="Pick a workout and when you're free — we'll find the least crowded time." />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div ref={formTopRef} className="scroll-mt-20">
          <PlannerForm preferences={preferences} today={today} issues={result.ok ? [] : result.issues} onFind={find} />
        </div>

        <div ref={resultRef} tabIndex={-1} className="scroll-mt-20 outline-none">
          <p className="sr-only" role="status">
            {preferences.showResult &&
              (result.ok
                ? `Best time ${formatRange(result.best.start, result.best.end)}`
                : "No session fits these inputs")}
          </p>
          {!preferences.showResult ? (
            <Card className="flex flex-col items-center py-10 text-center">
              <CalendarSearch className="mb-3 size-10 text-subtle" aria-hidden="true" />
              <p className="font-semibold">Your recommendation will appear here</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Choose a workout and your available hours, then press Find Best Time. Changing any input updates the result
                instantly.
              </p>
            </Card>
          ) : result.ok ? (
            <RecommendationView result={result} plans={state.plans} onEdit={edit} />
          ) : (
            <Card className="flex flex-col items-center py-10 text-center" role="alert">
              <SearchX className="mb-3 size-10 text-bad-ink" aria-hidden="true" />
              <p className="font-semibold">No session fits these inputs</p>
              <p className="mt-1 max-w-sm text-sm text-muted">{result.issues[0]?.message}</p>
              <p className="mt-2 text-sm text-muted">Adjust your date, hours, or duration to see a recommendation.</p>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SavedPlans plans={upcomingPlans(state.plans, now)} today={today} />
      </div>
    </div>
  );
}
