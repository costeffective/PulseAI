import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Layers3,
  Sparkles,
  Tags,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "AI classification",
    description:
      "Gemini tags every item with category, sentiment, and priority in seconds.",
  },
  {
    icon: BarChart3,
    title: "Batch trends",
    description:
      "Compare negative sentiment and top themes across uploads over time.",
  },
  {
    icon: Tags,
    title: "Smart filtering",
    description:
      "Filter by Bug, Feature request, Pricing, UX issue, Praise, and more.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get started
                <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="hero-glow border-b border-border/60">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <Badge variant="secondary" className="mb-5">
                Built for startup ops teams
              </Badge>
              <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                Turn scattered feedback into a clear action list
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Pulse helps small teams collect customer feedback, classify
                it by theme and sentiment, and surface what needs attention first.
                Paste a batch or upload a CSV, then review trends across batches
                over time.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup">
                  <Button size="lg">
                    Get started
                    <ArrowRight />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Free to try · Email sign-in · No credit card
                </p>
              </div>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section className="app-shell-bg border-b border-border/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 max-w-2xl">
              <h2 className="font-heading text-3xl tracking-tight text-foreground">
                Everything you need to triage feedback
              </h2>
              <p className="mt-3 text-muted-foreground">
                A focused internal tool — not another bloated CRM. Upload, classify,
                prioritize, and move on.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/15">
                      <feature.icon className="size-4.5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <Card className="overflow-hidden">
              <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <Upload className="size-4" />
                    <span className="text-sm font-medium">Simple workflow</span>
                  </div>
                  <h3 className="font-heading text-2xl tracking-tight">
                    Paste, upload, review — done in minutes
                  </h3>
                  <p className="mt-3 max-w-xl text-muted-foreground">
                    Drop in support tickets, NPS comments, or sales call notes. AI
                    handles the sorting so your team can focus on what to fix and
                    what to build next.
                  </p>
                </div>
                <Link href="/signup">
                  <Button size="lg">
                    Start triaging
                    <Layers3 />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <Logo size="sm" />
          <p>Pulse · AI feedback triage for small teams</p>
        </div>
      </footer>
    </div>
  );
}
