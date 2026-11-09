import { LEVEL_LABEL } from "@/lib/config";
import type { SlotPoint } from "@/lib/forecast";
import { LEVEL_STYLES } from "../ui";
import type { BarPoint } from "./ForecastBars";

/** Color each bar by its crowd level (with the level name in the tooltip). */
export function levelBars(points: SlotPoint[]): BarPoint[] {
  return points.map((p) => ({
    start: p.start,
    utilization: p.utilization,
    color: LEVEL_STYLES[p.level].fill,
    note: LEVEL_LABEL[p.level],
  }));
}

export const LEVEL_LEGEND = [
  { color: LEVEL_STYLES.quiet.fill, label: "Quiet (<55%)" },
  { color: LEVEL_STYLES.moderate.fill, label: "Moderate" },
  { color: LEVEL_STYLES.busy.fill, label: "Busy (75%+)" },
];
