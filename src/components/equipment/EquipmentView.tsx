"use client";

import { Clock, Megaphone, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EQUIPMENT_BY_ID } from "@/lib/config";
import { hourlyForecast, summarizeSeries } from "@/lib/forecast";
import { useAppData } from "@/lib/hooks";
import { type EquipmentStatus, gymSnapshot } from "@/lib/snapshot";
import { formatAxisTime, formatRange, formatTimestamp, minutesOfDay } from "@/lib/time";
import type { EquipmentId } from "@/lib/types";
import { useAppUI } from "../AppUI";
import { ChartLegend, ForecastBars } from "../charts/ForecastBars";
import { LEVEL_LEGEND, levelBars } from "../charts/levelBars";
import { EQUIPMENT_ICON } from "../icons";
import { Button, Card, LEVEL_STYLES, LevelChip, PageHeader, UtilBar, cx, equipmentStatusLabel } from "../ui";

type Filter = "all" | "available" | "busy";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available now" },
  { id: "busy", label: "Busy" },
];

const matches = (e: EquipmentStatus, f: Filter) =>
  f === "all" ? true : f === "available" ? e.available > 0 : e.level === "busy";

const isEquipmentId = (v: string | null): v is EquipmentId => v !== null && v in EQUIPMENT_BY_ID;

export function EquipmentView() {
  const { state, now, today } = useAppData();
  const params = useSearchParams();
  const focus = params.get("focus");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<EquipmentId | null>(isEquipmentId(focus) ? focus : null);
  const snapshot = gymSnapshot(now, state.reports);
  const visible = snapshot.equipment.filter((e) => matches(e, filter));
  const selectedStatus = snapshot.equipment.find((e) => e.id === selected) ?? null;
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, snapshot.equipment.filter((e) => matches(e, f.id)).length]));

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle={
          snapshot.open
            ? `Today's demo snapshot · updated ${formatTimestamp(snapshot.updatedAt)}`
            : `Closed now · demo hours today ${formatRange(snapshot.hours.open, snapshot.hours.close)}`
        }
      />

      <div role="group" aria-label="Filter equipment" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              "h-9 rounded-full border px-4 text-sm font-medium transition-colors",
              filter === f.id
                ? "border-brand bg-brand-strong text-white"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {f.label} <span className="ml-1 opacity-75">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div>
          {visible.length === 0 ? (
            <Card className="text-center text-sm text-muted">
              {filter === "busy" ? "Nothing is busy right now." : "No equipment is free right now — check back soon."}
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visible.map((e) => (
                <li key={e.id} className="contents">
                  <EquipmentCard
                    status={e}
                    selected={selected === e.id}
                    onSelect={() => setSelected(selected === e.id ? null : e.id)}
                  />
                  {selected === e.id && (
                    <div className="sm:col-span-2 lg:hidden">
                      <EquipmentDetail status={e} today={today} now={now} onClose={() => setSelected(null)} scrollOnMount />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-subtle">
            Wait times are demo estimates. Counts come from a simulated model unless you reported them.
          </p>
        </div>

        <aside className="hidden lg:block" aria-label="Equipment details">
          <div className="sticky top-8">
            {selectedStatus ? (
              <EquipmentDetail status={selectedStatus} today={today} now={now} onClose={() => setSelected(null)} />
            ) : (
              <Card className="text-sm text-muted">
                Select a piece of equipment to see its hourly forecast and report what you see.
              </Card>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EquipmentCard({ status: e, selected, onSelect }: { status: EquipmentStatus; selected: boolean; onSelect: () => void }) {
  const Icon = EQUIPMENT_ICON[e.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={selected}
      className={cx(
        "w-full rounded-2xl border bg-surface p-4 text-left transition-colors",
        selected ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-strong hover:bg-surface-2",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-muted">
            <Icon className="size-5" />
          </span>
          <span>
            <span className="block font-semibold">{e.name}</span>
            <span className="block text-sm text-muted">
              <span className="font-semibold text-ink">{e.available}</span> of {e.total} available
            </span>
          </span>
        </span>
        <LevelChip level={e.level} label={equipmentStatusLabel(e.level, e.available)} />
      </span>
      <span className="mt-4 block">
        <UtilBar value={e.utilization} level={e.level} label={`${e.name} utilization`} />
      </span>
      <span className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          {e.inUse}/{e.total} in use · {Math.round(e.utilization * 100)}%
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {e.waitMinutes === 0 ? "No wait" : `~${e.waitMinutes} min wait`}
          <span className="text-subtle">(est.)</span>
        </span>
      </span>
      <span className="mt-1 block text-xs text-subtle">
        Updated {formatTimestamp(e.updatedAt)}
        {e.source === "report" && " · your report"}
      </span>
    </button>
  );
}

function EquipmentDetail({
  status: e,
  today,
  now,
  onClose,
  scrollOnMount = false,
}: {
  status: EquipmentStatus;
  today: string;
  now: number;
  onClose: () => void;
  scrollOnMount?: boolean;
}) {
  const { openReport } = useAppUI();
  const ref = useRef<HTMLDivElement>(null);
  const points = hourlyForecast([e.id], today);
  const nowHour = Math.floor(minutesOfDay(now) / 60) * 60;

  useEffect(() => {
    if (scrollOnMount) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [scrollOnMount]);

  return (
    <div ref={ref}>
      <Card as="div" className="border-brand/40" aria-label={`${e.name} details`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{e.name}</h2>
            <p className={cx("text-sm", LEVEL_STYLES[e.level].text)}>
              {equipmentStatusLabel(e.level, e.available)} · {e.available} of {e.total} free
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${e.name} details`}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Today&apos;s hourly forecast</p>
        <ForecastBars
          data={levelBars(points)}
          height={150}
          tickEvery={4}
          highlightStart={points.some((p) => p.start === nowHour) ? nowHour : undefined}
          summary={`${e.name} forecast for today. ${summarizeSeries(points, formatAxisTime)}`}
        />
        <div className="mt-2">
          <ChartLegend items={LEVEL_LEGEND} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-subtle">Estimated wait (demo)</dt>
            <dd className="font-semibold">{e.waitMinutes === 0 ? "No wait" : `~${e.waitMinutes} min`}</dd>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-subtle">Last updated</dt>
            <dd className="font-semibold">{formatTimestamp(e.updatedAt)}</dd>
          </div>
        </dl>
        <Button variant="secondary" className="mt-4 w-full" onClick={() => openReport(e.id)}>
          <Megaphone className="size-4" aria-hidden="true" />
          Report {e.name.toLowerCase()}
        </Button>
      </Card>
    </div>
  );
}
