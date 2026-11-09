"use client";

import { CircleCheck } from "lucide-react";
import { useId, useState } from "react";
import { addReport } from "@/lib/actions";
import { EQUIPMENT, EQUIPMENT_BY_ID, LEVEL_LABEL } from "@/lib/config";
import { formatTimestamp } from "@/lib/time";
import type { CrowdLevel, EquipmentId } from "@/lib/types";
import { Modal } from "./Modal";
import { Button, LEVEL_STYLES, cx } from "./ui";

type Target = "crowd" | EquipmentId;

export function ReportModal({
  open,
  initialTarget,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  initialTarget: Target;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report conditions"
      description="Simulated report — saved only on this device and never shared with the gym or other users."
    >
      <ReportForm initialTarget={initialTarget} onClose={onClose} onSubmitted={onSubmitted} />
    </Modal>
  );
}

const LEVELS: CrowdLevel[] = ["quiet", "moderate", "busy"];

function ReportForm({
  initialTarget,
  onClose,
  onSubmitted,
}: {
  initialTarget: Target;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  const [target, setTarget] = useState<Target>(initialTarget);
  const [level, setLevel] = useState<CrowdLevel | null>(null);
  const [inUse, setInUse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const ids = { target: useId(), count: useId(), error: useId() };

  if (done) {
    return (
      <div className="text-center" role="status">
        <CircleCheck className="mx-auto mb-3 size-10 text-good-ink" aria-hidden="true" />
        <p className="font-semibold">Thanks — report saved</p>
        <p className="mt-1 text-sm text-muted">{done}</p>
        <p className="mt-3 text-xs text-subtle">
          This is a simulated report stored in this browser only. It updates today&apos;s demo snapshot for the next 2 hours
          and does not change the forecast.
        </p>
        <Button className="mt-5 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  const equipment = target === "crowd" ? null : EQUIPMENT_BY_ID[target];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const time = formatTimestamp(Date.now());
    if (!equipment) {
      if (!level) return setError("Choose how crowded the gym feels.");
      addReport({ kind: "crowd", level });
      setDone(`Overall crowding set to ${LEVEL_LABEL[level]} at ${time}.`);
      onSubmitted("Crowd report saved on this device");
      return;
    }
    const n = Number(inUse);
    if (inUse.trim() === "" || !Number.isInteger(n) || n < 0 || n > equipment.total) {
      return setError(`Enter a whole number from 0 to ${equipment.total} — there are ${equipment.total} ${equipment.name.toLowerCase()}.`);
    }
    addReport({ kind: "equipment", equipmentId: equipment.id, inUse: n });
    setDone(`${equipment.name}: ${n} of ${equipment.total} in use, updated ${time}.`);
    onSubmitted(`${equipment.name} report saved on this device`);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor={ids.target} className="mb-1.5 block text-sm font-medium">
          What are you reporting?
        </label>
        <select
          id={ids.target}
          value={target}
          onChange={(e) => {
            setTarget(e.target.value as Target);
            setError(null);
          }}
          className="h-11 w-full rounded-xl border border-line-strong bg-surface-2 px-3 text-sm"
        >
          <option value="crowd">Overall gym crowding</option>
          {EQUIPMENT.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.total} total)
            </option>
          ))}
        </select>
      </div>

      {equipment ? (
        <div>
          <label htmlFor={ids.count} className="mb-1.5 block text-sm font-medium">
            How many {equipment.name.toLowerCase()} are in use right now?
          </label>
          <div className="flex items-center gap-3">
            <input
              id={ids.count}
              type="number"
              inputMode="numeric"
              min={0}
              max={equipment.total}
              step={1}
              value={inUse}
              onChange={(e) => {
                setInUse(e.target.value);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? ids.error : undefined}
              className="h-11 w-24 rounded-xl border border-line-strong bg-surface-2 px-3 text-sm"
            />
            <span className="text-sm text-muted">of {equipment.total} in use</span>
          </div>
        </div>
      ) : (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">How crowded is it?</legend>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <label
                key={l}
                className={cx(
                  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-soft",
                  level === l ? "border-brand bg-brand/15 text-ink" : "border-line-strong bg-surface-2 text-muted hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="crowd-level"
                  value={l}
                  checked={level === l}
                  onChange={() => {
                    setLevel(l);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <span className={cx("size-2 rounded-full", LEVEL_STYLES[l].bar)} aria-hidden="true" />
                {LEVEL_LABEL[l]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && (
        <p id={ids.error} role="alert" className="text-sm text-bad-ink">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Submit report
        </Button>
      </div>
    </form>
  );
}
