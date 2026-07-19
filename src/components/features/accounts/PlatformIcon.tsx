import { cn } from "@/lib/utils";
import {
  PLATFORM_ONBOARDING_DETAILS,
  type Platform,
} from "@/lib/platforms/constraints";

interface PlatformIconProps {
  platform: Platform;
  className?: string;
}

const PLATFORM_MARKS: Record<Platform, string> = {
  X: "X",
  FACEBOOK: "f",
  INSTAGRAM: "ig",
  TIKTOK: "♪",
  LINKEDIN: "in",
};

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const details = PLATFORM_ONBOARDING_DETAILS[platform];

  return (
    <span
      aria-label={details.name}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: details.color }}
      title={details.name}
    >
      {PLATFORM_MARKS[platform]}
    </span>
  );
}
