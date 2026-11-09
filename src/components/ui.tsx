import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LEVEL_LABEL } from "@/lib/config";
import type { CrowdLevel } from "@/lib/types";

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

export function Card({
  children,
  className,
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cx("rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_0_0_rgb(255_255_255/0.03)_inset] sm:p-5", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-base font-semibold tracking-tight">
        {children}
      </h2>
      {action}
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-strong text-white shadow-lg shadow-blue-900/30 hover:bg-[#1f57d6] active:bg-[#1c4fc2]",
  secondary: "border border-line-strong bg-surface-2 text-ink hover:border-brand/60 hover:bg-surface-3",
  ghost: "text-brand-soft hover:bg-surface-2",
  danger: "bg-bad/90 text-white hover:bg-bad",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function buttonClass(variant: Variant = "primary", size: "sm" | "md" | "lg" = "md", className?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-base",
    VARIANTS[variant],
    className,
  );
}

export const LEVEL_STYLES: Record<CrowdLevel, { text: string; bar: string; chip: string; fill: string }> = {
  quiet: { text: "text-good-ink", bar: "bg-good", chip: "bg-good/12 text-good-ink ring-good/30", fill: "#22c55e" },
  moderate: { text: "text-warn-ink", bar: "bg-warn", chip: "bg-warn/12 text-warn-ink ring-warn/30", fill: "#f59e0b" },
  busy: { text: "text-bad-ink", bar: "bg-bad", chip: "bg-bad/12 text-bad-ink ring-bad/30", fill: "#ef4444" },
};

export function LevelChip({ level, label, className }: { level: CrowdLevel; label?: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        LEVEL_STYLES[level].chip,
        className,
      )}
    >
      <span className={cx("size-1.5 rounded-full", LEVEL_STYLES[level].bar)} aria-hidden="true" />
      {label ?? LEVEL_LABEL[level]}
    </span>
  );
}

/** Equipment availability label; text always accompanies the color. */
export function equipmentStatusLabel(level: CrowdLevel, available: number): string {
  if (available === 0) return "Full";
  if (level === "quiet") return "Available";
  if (level === "moderate") return "Filling up";
  return "Busy";
}

export function UtilBar({ value, level, label }: { value: number; level: CrowdLevel; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}% in use`}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
    >
      <div className={cx("h-full rounded-full transition-[width] duration-500", LEVEL_STYLES[level].bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-surface", className)} aria-hidden="true" />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
