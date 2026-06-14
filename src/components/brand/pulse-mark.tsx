import { cn } from "@/lib/utils";

interface PulseMarkProps {
  className?: string;
}

export function PulseMark({ className }: PulseMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <circle cx="12" cy="12" r="2.75" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.75"
        opacity="0.72"
      />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.36"
      />
    </svg>
  );
}
