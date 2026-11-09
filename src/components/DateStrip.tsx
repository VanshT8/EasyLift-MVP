"use client";

import { formatMonthDay, nextSevenDays, shortWeekday } from "@/lib/time";
import type { DateKey } from "@/lib/types";
import { cx } from "./ui";

/** Today plus the next six days as toggle buttons. */
export function DateStrip({
  today,
  value,
  onChange,
  label = "Choose a date",
}: {
  today: DateKey;
  value: DateKey;
  onChange: (date: DateKey) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <div className="flex gap-2 sm:grid sm:grid-cols-7">
        {nextSevenDays(today).map((d) => {
          const selected = d === value;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(d)}
              className={cx(
                "flex min-w-16 flex-col items-center rounded-xl border px-2 py-2 text-sm transition-colors sm:min-w-0",
                selected
                  ? "border-brand bg-brand-strong text-white shadow-lg shadow-blue-900/30"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              <span className="font-semibold">{d === today ? "Today" : shortWeekday(d)}</span>
              <span className={cx("text-xs", selected ? "text-blue-100" : "text-subtle")}>{formatMonthDay(d)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
