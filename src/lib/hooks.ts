"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "./storage";
import { addDays, toDateKey } from "./time";
import type { PersistedState, PlannerPreferences } from "./types";

/** Persisted app state; null during server render and before hydration. */
export function useStoredState(): PersistedState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const MINUTE = 60_000;

function subscribeMinute(listener: () => void) {
  let interval: number | undefined;
  const timeout = window.setTimeout(() => {
    listener();
    interval = window.setInterval(listener, MINUTE);
  }, MINUTE - (Date.now() % MINUTE));
  const onVisible = () => document.visibilityState === "visible" && listener();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

const getMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** Current time rounded down to the minute; null on the server. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeMinute, getMinute, () => null);
}

export function useToday(): string | null {
  const now = useNow();
  return now === null ? null : toDateKey(new Date(now));
}

function subscribeReducedMotion(listener: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

/** Stored planner preferences with the date clamped to today … today + 6. */
export function normalizePreferences(prefs: PlannerPreferences, today: string): PlannerPreferences {
  const last = addDays(today, 6);
  const date = prefs.date && prefs.date >= today && prefs.date <= last ? prefs.date : today;
  return date === prefs.date ? prefs : { ...prefs, date };
}

/** For components rendered only after hydration (inside AppShell's ready gate). */
export function useAppData() {
  const state = useStoredState();
  const now = useNow();
  if (state === null || now === null) throw new Error("useAppData used before client state was ready");
  const today = toDateKey(new Date(now));
  return { state, now, today, preferences: normalizePreferences(state.preferences, today) };
}
