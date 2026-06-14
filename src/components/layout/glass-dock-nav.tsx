import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlassDockNavProps {
  className?: string;
  variant?: "landing" | "auth";
}

export function GlassDockNav({ className, variant = "landing" }: GlassDockNavProps) {
  const isAuth = variant === "auth";

  return (
    <div className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6", className)}>
      <nav className="glass-dock pointer-events-auto flex w-full max-w-4xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {isAuth ? (
            <>
              <Link href="/" className="shrink-0 lg:hidden">
                <Logo size="sm" />
              </Link>
              <Link
                href="/"
                className="glass-dock-item hidden items-center gap-1.5 sm:inline-flex"
              >
                <ArrowLeft className="size-3.5" />
                <span>Home</span>
              </Link>
            </>
          ) : (
            <Link href="/" className="shrink-0">
              <Logo size="sm" />
            </Link>
          )}
        </div>

        <div className="glass-dock-actions flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {isAuth ? null : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Get started
                  <ArrowRight />
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
