/**
 * "Right now" demo conditions for today: the simulated forecast for the current
 * slot, overridden by any recent condition report the user submitted on this device.
 * Reports never feed back into the forecast model.
 */
import { EQUIPMENT, GYM, SLOT_MINUTES, levelForUtilization } from "./config";
import { type ForecastFn, demoForecast, gymHours, isOpen, slotStartFor } from "./forecast";
import { minutesOfDay, toDateKey } from "./time";
import type { ConditionReport, CrowdLevel, DateKey, EquipmentId } from "./types";

/** How long a user report replaces the simulated snapshot. */
export const REPORT_TTL_MS = 2 * 60 * 60 * 1000;
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

export interface EquipmentStatus {
  id: EquipmentId;
  name: string;
  total: number;
  inUse: number;
  available: number;
  /** inUse / total, so counts and percentages always agree. */
  utilization: number;
  level: CrowdLevel;
  /** Demo estimate; always 0 when a unit is free. */
  waitMinutes: number;
  updatedAt: number;
  source: "forecast" | "report";
}

export interface GymSnapshot {
  date: DateKey;
  open: boolean;
  hours: { open: number; close: number };
  equipment: EquipmentStatus[];
  utilization: number;
  occupancy: number;
  level: CrowdLevel;
  levelSource: "forecast" | "report";
  updatedAt: number;
}

function activeReports(reports: ConditionReport[], now: number): ConditionReport[] {
  const today = toDateKey(new Date(now));
  return reports
    // `now` is minute-rounded, so a report from a few seconds ago can be slightly "ahead" of it.
    .filter((r) => now - r.createdAt < REPORT_TTL_MS && toDateKey(new Date(r.createdAt)) === today)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function gymSnapshot(now: number, reports: ConditionReport[], forecast: ForecastFn = demoForecast): GymSnapshot {
  const date = toDateKey(new Date(now));
  const minute = minutesOfDay(now);
  const open = isOpen(date, minute);
  const slot = slotStartFor(minute);
  const forecastUpdatedAt = Math.floor(now / SNAPSHOT_INTERVAL_MS) * SNAPSHOT_INTERVAL_MS;
  const recent = activeReports(reports, now);

  const equipment = EQUIPMENT.map<EquipmentStatus>((e) => {
    const report = recent.find((r) => r.kind === "equipment" && r.equipmentId === e.id);
    let inUse: number;
    let updatedAt = forecastUpdatedAt;
    let source: EquipmentStatus["source"] = "forecast";
    if (report && report.kind === "equipment") {
      inUse = Math.min(e.total, Math.max(0, report.inUse));
      updatedAt = report.createdAt;
      source = "report";
    } else {
      inUse = open ? Math.round(forecast(e.id, date, slot) * e.total) : 0;
    }
    const available = e.total - inUse;
    const utilization = inUse / e.total;
    const nextSlotDemand = forecast(e.id, date, slot + SLOT_MINUTES);
    const waitMinutes = available > 0 ? 0 : Math.max(2, Math.round(e.baseWaitMinutes * (0.6 + nextSlotDemand)));
    return {
      id: e.id,
      name: e.name,
      total: e.total,
      inUse,
      available,
      utilization,
      level: levelForUtilization(utilization),
      waitMinutes,
      updatedAt,
      source,
    };
  });

  const totalUnits = equipment.reduce((s, e) => s + e.total, 0);
  const utilization = equipment.reduce((s, e) => s + e.inUse, 0) / totalUnits;
  const crowdReport = recent.find((r) => r.kind === "crowd");

  return {
    date,
    open,
    hours: gymHours(date),
    equipment,
    utilization,
    occupancy: Math.round(utilization * GYM.capacity),
    level: crowdReport && crowdReport.kind === "crowd" ? crowdReport.level : levelForUtilization(utilization),
    levelSource: crowdReport ? "report" : "forecast",
    updatedAt: Math.max(forecastUpdatedAt, ...equipment.map((e) => e.updatedAt), crowdReport?.createdAt ?? 0),
  };
}
