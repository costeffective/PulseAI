import { BarChart3, MailCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

const highlights = [
  {
    icon: Sparkles,
    title: "AI triage in seconds",
    description: "Category, sentiment, and priority on every item.",
  },
  {
    icon: BarChart3,
    title: "Trends across batches",
    description: "Spot negative spikes and recurring themes fast.",
  },
  {
    icon: MailCheck,
    title: "Passwordless access",
    description: "Secure magic links — no passwords to remember.",
  },
];

interface AuthSidePanelProps {
  mode: "login" | "signup";
}

export function AuthSidePanel({ mode }: AuthSidePanelProps) {
  const isSignup = mode === "signup";

  return (
    <div className="auth-panel relative hidden flex-col justify-between overflow-hidden border-r border-border/40 p-10 lg:flex lg:min-h-full lg:w-[44%] lg:shrink-0 xl:p-12">
      <div className="relative z-10">
        <Link href="/">
          <Logo variant="light" />
        </Link>
      </div>

      <div className="relative z-10 max-w-md">
        <Badge className="mb-6 border-white/15 bg-white/10 text-white hover:bg-white/10 dark:border-white/15 dark:bg-white/10 dark:text-white">
          {isSignup ? "Free to start" : "Welcome back"}
        </Badge>
        <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-white xl:text-[2.75rem]">
          {isSignup
            ? "Start turning feedback into action"
            : "Pick up where you left off"}
        </h1>
        <p className="mt-4 text-base leading-7 text-white/65">
          {isSignup
            ? "Create your workspace in under a minute. Paste feedback or upload a CSV and let AI surface what needs attention first."
            : "Your batches, AI summaries, and classified feedback are waiting. Sign in with a magic link sent to your inbox."}
        </p>

        <ul className="mt-10 space-y-5">
          {highlights.map((item) => (
            <li key={item.title} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/12">
                <item.icon className="size-4.5" />
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-white">
                  {item.title}
                </p>
                <p className="mt-1 font-sans text-sm leading-6 text-white/60">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 font-sans text-xs text-white/45">
        Trusted by ops and product teams shipping faster with clearer feedback.
      </p>

      <div
        className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-white/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 -left-20 size-56 rounded-full bg-white/4 blur-3xl"
        aria-hidden
      />
    </div>
  );
}
