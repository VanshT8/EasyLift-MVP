"use client";

import { ArrowRight, CalendarClock, ChartColumn, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LogoFull, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui";
import { completeOnboarding } from "@/lib/actions";
import { DEFAULT_NAME, GYM } from "@/lib/config";
import { useStoredState } from "@/lib/hooks";

const BENEFITS = [
  { icon: Users, title: "Equipment availability", body: "See how many racks, benches, and machines are free." },
  { icon: CalendarClock, title: "Workout-specific recommendations", body: "Get the best time for the equipment your workout needs." },
  { icon: ChartColumn, title: "Crowd forecasts", body: "Plan ahead with hour-by-hour demand for the next 7 days." },
];

export default function WelcomePage() {
  const state = useStoredState();
  const router = useRouter();
  const returning = state?.profile.onboarded === true;

  useEffect(() => {
    if (returning) router.replace("/home");
  }, [returning, router]);

  if (state === null || returning) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <LogoMark className="h-12 w-auto animate-pulse" title="EasyLift is loading" />
      </div>
    );
  }
  // Onboarding flips `returning`, and the effect above routes to the dashboard.
  return <Welcome />;
}

function Welcome() {
  const [name, setName] = useState("");
  const nameId = useId();

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-5 py-10 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1>
              <LogoFull className="h-auto w-56 sm:w-64" />
            </h1>
          </div>
          <ul className="mt-9 space-y-5">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-brand-soft">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <form
          className="rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/30 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            completeOnboarding(name);
          }}
        >
          <h2 className="text-xl font-semibold">Try the demo</h2>
          <p className="mt-1 text-sm text-muted">No account needed. Everything stays in this browser.</p>

          <label htmlFor={nameId} className="mt-6 block text-sm font-medium">
            First name <span className="font-normal text-subtle">(optional)</span>
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="given-name"
            placeholder={DEFAULT_NAME}
            className="mt-1.5 h-12 w-full rounded-xl border border-line-strong bg-surface-2 px-4 placeholder:text-subtle"
          />

          <div className="mt-5 rounded-2xl border border-warn/25 bg-warn/8 p-4 text-sm">
            <p className="font-semibold text-warn-ink">Sample scenario</p>
            <p className="mt-1 text-muted">
              The demo gym is <span className="text-ink">{GYM.name}</span>. Equipment counts, availability, and forecasts
              are fictional and simulated.
            </p>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full">
            Try the Demo
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </main>
  );
}
