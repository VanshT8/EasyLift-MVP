"use client";

import { ReadyGate } from "@/components/AppShell";
import { Info, Megaphone } from "lucide-react";
import { useState } from "react";
import { useAppUI } from "@/components/AppUI";
import { DateStrip } from "@/components/DateStrip";
import {
  CrowdCard,
  EquipmentSummary,
  FeedbackPrompt,
  HourlyForecastCard,
  NextWorkoutCard,
  RecommendationCard,
} from "@/components/dashboard/DashboardCards";
import { Button } from "@/components/ui";
import { GYM } from "@/lib/config";
import { useAppData } from "@/lib/hooks";
import { upcomingPlans } from "@/lib/plans";
import { recommend } from "@/lib/recommend";
import { gymSnapshot } from "@/lib/snapshot";
import { formatDate, greeting, minutesOfDay } from "@/lib/time";

export default function HomePage() {
  return (
    <ReadyGate>
      <HomeView />
    </ReadyGate>
  );
}

function HomeView() {
  const { state, now, today, preferences } = useAppData();
  const { openReport } = useAppUI();
  const [selected, setSelected] = useState<string | null>(null);
  // Fall back to today if the selection rolled out of range (e.g. after midnight).
  const date = selected && selected >= today ? selected : today;

  const snapshot = gymSnapshot(now, state.reports);
  const result = recommend(
    { ...preferences, date },
    { today, notBefore: date === today ? minutesOfDay(now) : undefined },
  );
  const nextPlan = upcomingPlans(state.plans, now)[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting(minutesOfDay(now))}, {state.profile.name} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {GYM.name} <span className="text-subtle">(sample)</span> · {formatDate(date)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => openReport()}>
          <Megaphone className="size-4" aria-hidden="true" />
          Report conditions
        </Button>
      </div>

      <DateStrip today={today} value={date} onChange={setSelected} label="Forecast date" />

      {date !== today && (
        <p className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-blue-100">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-soft" aria-hidden="true" />
          <span>
            Showing the <strong>forecast for {formatDate(date)}</strong>. Crowd and equipment counts below are
            today&apos;s live demo snapshot.
          </span>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecommendationCard result={result} preferences={preferences} date={date} today={today} />
        </div>
        <div className="lg:col-span-2">
          <HourlyForecastCard date={date} today={today} now={now} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <EquipmentSummary snapshot={snapshot} />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <CrowdCard snapshot={snapshot} />
          <NextWorkoutCard plan={nextPlan} today={today} />
          <FeedbackPrompt />
        </div>
      </div>
    </div>
  );
}
