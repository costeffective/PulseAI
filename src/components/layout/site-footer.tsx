import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PulseMarkGraphic } from "@/components/brand/pulse-mark-graphic";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const productLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/integrations", label: "Integrations" },
  { href: "/signup", label: "Get started" },
];

const accountLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
];

interface SiteFooterProps {
  variant?: "marketing" | "compact";
  className?: string;
}

export function SiteFooter({ variant = "marketing", className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  if (variant === "compact") {
    return (
      <footer
        className={cn(
          "border-t border-border/50 bg-background/60 px-6 py-5 backdrop-blur-sm",
          className,
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="font-sans text-xs text-muted-foreground">
            © {year} Pulse · Feedback intelligence for small teams
          </p>
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          >
            {productLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("relative mt-auto overflow-hidden border-t border-border/40", className)}>
      <div
        className="pointer-events-none absolute -right-8 -bottom-16 opacity-[0.07] dark:opacity-[0.12]"
        aria-hidden
      >
        <PulseMarkGraphic size={220} color="currentColor" />
      </div>
      <div
        className="pointer-events-none absolute -left-12 top-8 size-48 rounded-full bg-primary/10 blur-3xl dark:bg-white/5"
        aria-hidden
      />

      <div className="site-footer-panel relative mx-auto max-w-6xl px-6 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
          <div className="space-y-4">
            <Logo size="md" />
            <p className="max-w-sm font-sans text-sm leading-6 text-muted-foreground">
              Turn scattered customer feedback into classified, prioritized action.
              Built for startup ops and product teams who need clarity, not another CRM.
            </p>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Product
            </p>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Account
            </p>
            <ul className="mt-4 space-y-2.5">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-6 inline-flex rounded-full",
              )}
            >
              Start free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/50 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-muted-foreground">
            © {year} Pulse. All rights reserved.
          </p>
          <p className="font-sans text-xs text-muted-foreground/80">
            Paste, upload, or sync — then triage what matters first.
          </p>
        </div>
      </div>
    </footer>
  );
}
