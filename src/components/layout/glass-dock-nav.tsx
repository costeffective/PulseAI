import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dockBtn = "h-8 rounded-full px-3.5";

interface GlassDockNavProps {
  className?: string;
  variant?: "landing" | "auth";
}

export function GlassDockNav({ className, variant = "landing" }: GlassDockNavProps) {
  const isAuth = variant === "auth";

  return (
    <div
      className={cn(
        isAuth
          ? "z-10 flex w-full shrink-0 justify-center px-4 pt-4 sm:px-6 lg:justify-end lg:px-10 lg:pt-6"
          : "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6",
        className,
      )}
    >
      <nav
        className={cn(
          "glass-dock pointer-events-auto flex items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5",
          isAuth ? "w-full max-w-md sm:max-w-lg lg:w-auto lg:max-w-none" : "w-full max-w-4xl",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isAuth ? (
            <>
              <Link href="/" className="shrink-0 lg:hidden">
                <Logo size="sm" />
              </Link>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  dockBtn,
                  "inline-flex",
                )}
              >
                <ArrowLeft className="size-3.5" />
                Home
              </Link>
            </>
          ) : (
            <Link href="/" className="shrink-0">
              <Logo size="sm" />
            </Link>
          )}
        </div>

        <div className="glass-dock-actions flex shrink-0 items-center gap-0.5 p-1">
          <ThemeToggle />
          {isAuth ? null : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  dockBtn,
                  "hidden sm:inline-flex",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "sm" }), dockBtn)}
              >
                <span className="hidden sm:inline">Get started</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
