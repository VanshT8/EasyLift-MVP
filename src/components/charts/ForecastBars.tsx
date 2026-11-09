"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "@/lib/hooks";
import { formatAxisTime, formatTime } from "@/lib/time";

export interface BarPoint {
  start: number;
  utilization: number;
  /** Bar fill color. */
  color: string;
  /** Short text for the tooltip, e.g. "Busy" or "Recommended session". */
  note: string;
}

/**
 * Single-series utilization bars. Callers pass a text summary that is rendered
 * as the figure caption, so the chart never relies on color alone.
 */
export function ForecastBars({
  data,
  summary,
  height = 180,
  highlightStart,
  tickEvery = 1,
}: {
  data: BarPoint[];
  summary: string;
  height?: number;
  /** Draws a "Now" reference line at this bar. */
  highlightStart?: number;
  tickEvery?: number;
}) {
  const reducedMotion = useReducedMotion();
  const ticks = data.filter((_, i) => i % tickEvery === 0).map((d) => d.start);

  return (
    <figure className="m-0">
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="#1f2a45" />
            <XAxis
              dataKey="start"
              ticks={ticks}
              tickFormatter={formatAxisTime}
              tick={{ fill: "#9aa8c4", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              minTickGap={4}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.5, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: "#9aa8c4", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            {highlightStart !== undefined && (
              <ReferenceLine
                x={highlightStart}
                stroke="#8db8ff"
                strokeDasharray="3 3"
                label={{ value: "Now", position: "top", fill: "#8db8ff", fontSize: 11 }}
              />
            )}
            <Tooltip
              cursor={{ fill: "rgb(141 184 255 / 0.08)" }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const p = active && payload?.[0] ? (payload[0].payload as BarPoint) : null;
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-line-strong bg-surface-3 px-3 py-2 text-xs shadow-xl">
                    <p className="font-semibold text-ink">{formatTime(p.start)}</p>
                    <p className="text-muted">
                      {Math.round(p.utilization * 100)}% predicted use · {p.note}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="utilization" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={!reducedMotion}>
              {data.map((d) => (
                <Cell key={d.start} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-xs text-muted">{summary}</figcaption>
    </figure>
  );
}

export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Chart legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
