import { BicepsFlexed, Dumbbell, Footprints, Layers, type LucideIcon, type LucideProps, PersonStanding } from "lucide-react";
import type { EquipmentId, WorkoutId } from "@/lib/types";

/** Line icons drawn in the same 24px / 2px-stroke style as Lucide for equipment Lucide lacks. */
function makeIcon(paths: React.ReactNode, name: string) {
  const Icon = ({ size = 24, strokeWidth = 2, className, ...rest }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {paths}
    </svg>
  );
  Icon.displayName = name;
  return Icon as unknown as LucideIcon;
}

export const SquatRackIcon = makeIcon(
  <>
    <path d="M6 3v18M18 3v18M3 21h6M15 21h6" />
    <path d="M2 9h20" />
    <path d="M4 7v4M20 7v4" />
  </>,
  "SquatRackIcon",
);

export const LegPressIcon = makeIcon(
  <>
    <path d="M4 20h16" />
    <path d="M6 20 17 6" />
    <path d="m14.5 4 5 4" />
    <path d="M7 14h4v6" />
  </>,
  "LegPressIcon",
);

export const BenchIcon = makeIcon(
  <>
    <path d="M4 14h11M7 14v5M13 14v5" />
    <path d="M2 8h20M5 6v4M19 6v4" />
    <path d="M17 14l2-2" />
  </>,
  "BenchIcon",
);

export const CableIcon = makeIcon(
  <>
    <path d="M4 21V3h16v18" />
    <circle cx="12" cy="7" r="1.5" />
    <path d="M12 8.5V15M9 15h6" />
    <path d="M2 21h20" />
  </>,
  "CableIcon",
);

export const TreadmillIcon = makeIcon(
  <>
    <path d="M3 18h14l3-11" />
    <path d="M18 7h3" />
    <circle cx="5" cy="18" r="2" />
    <circle cx="15" cy="18" r="2" />
  </>,
  "TreadmillIcon",
);

export const EQUIPMENT_ICON: Record<EquipmentId, LucideIcon> = {
  "squat-rack": SquatRackIcon,
  "leg-press": LegPressIcon,
  "bench-press": BenchIcon,
  cable: CableIcon,
  dumbbell: Dumbbell,
  treadmill: TreadmillIcon,
};

export const WORKOUT_ICON: Record<WorkoutId, LucideIcon> = {
  legs: Footprints,
  chest: BenchIcon,
  back: PersonStanding,
  shoulders: Dumbbell,
  arms: BicepsFlexed,
  "full-body": Layers,
};
