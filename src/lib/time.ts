import type { DateKey, Minutes } from "./types";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function weekday(key: DateKey): number {
  return parseDateKey(key).getDay();
}

/** Today plus the following six days. */
export function nextSevenDays(today: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i));
}

export function minutesOfDay(timestamp: number): Minutes {
  const d = new Date(timestamp);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatTime(minutes: Minutes): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(mm)} ${suffix}`;
}

/** Compact hour label for chart axes, e.g. "5 PM" or "5:30". */
export function formatAxisTime(minutes: Minutes): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const mm = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  if (mm !== 0) return `${h12}:${pad(mm)}`;
  return `${h12} ${h24 < 12 ? "AM" : "PM"}`;
}

export function formatRange(start: Minutes, end: Minutes): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatTimestamp(timestamp: number): string {
  return formatTime(minutesOfDay(timestamp));
}

export function shortWeekday(key: DateKey): string {
  return WEEKDAYS_SHORT[weekday(key)];
}

export function longWeekday(key: DateKey): string {
  return WEEKDAYS_LONG[weekday(key)];
}

/** "Tue, Mar 11" */
export function formatDate(key: DateKey): string {
  const d = parseDateKey(key);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Mar 11" */
export function formatMonthDay(key: DateKey): string {
  const d = parseDateKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Today", "Tomorrow", or "Tue, Mar 11" */
export function formatRelativeDate(key: DateKey, today: DateKey): string {
  if (key === today) return "Today";
  if (key === addDays(today, 1)) return "Tomorrow";
  return formatDate(key);
}

export function greeting(minutes: Minutes): string {
  if (minutes < 12 * 60) return "Good morning";
  if (minutes < 17 * 60) return "Good afternoon";
  return "Good evening";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
