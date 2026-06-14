import { PULSE_MARK_VIEWBOX } from "@/lib/brand";

interface PulseMarkGraphicProps {
  size?: number;
  color?: string;
}

export function PulseMarkGraphic({
  size = 24,
  color = "currentColor",
}: PulseMarkGraphicProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={PULSE_MARK_VIEWBOX}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.75" fill={color} />
      <circle
        cx="12"
        cy="12"
        r="6.25"
        stroke={color}
        strokeWidth="1.75"
        opacity="0.72"
      />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke={color}
        strokeWidth="1.25"
        opacity="0.36"
      />
    </svg>
  );
}
