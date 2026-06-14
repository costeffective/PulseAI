import { PulseMark } from "@/components/brand/pulse-mark";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "light";
}

export function Logo({
  className,
  showWordmark = true,
  size = "md",
  variant = "default",
}: LogoProps) {
  const isSmall = size === "sm";
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center", isSmall ? "gap-2" : "gap-2.5", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground shadow-[0_1px_2px_oklch(0.25_0.06_265/0.18),inset_0_1px_0_oklch(1_0_0/0.12)] ring-1 ring-primary/25",
          isSmall ? "size-8" : "size-9",
          isLight && "from-white via-white to-white/90 text-black ring-white/20 shadow-none",
        )}
      >
        <PulseMark className={isSmall ? "size-[17px]" : "size-[19px]"} />
      </div>

      {showWordmark && (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              "font-brand",
              isSmall ? "text-[15px]" : "text-[17px]",
              isLight ? "text-white" : "text-foreground",
            )}
          >
            Pulse
          </p>
          {!isSmall && (
            <p
              className={cn(
                "mt-1 font-sans text-[10px] font-medium uppercase tracking-[0.14em]",
                isLight ? "text-white/65" : "text-muted-foreground/90",
              )}
            >
              Feedback intelligence
            </p>
          )}
        </div>
      )}
    </div>
  );
}
