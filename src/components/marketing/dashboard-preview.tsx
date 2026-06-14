import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const previewStats = [
  { label: "Total feedback", value: "47" },
  { label: "% Negative", value: "34%" },
  { label: "High priority", value: "8" },
  { label: "Top theme", value: "UX issue" },
];

const previewRows = [
  {
    text: "The onboarding flow loses me at step 3 — too many fields",
    category: "UX issue",
    sentiment: "negative",
    priority: "high",
  },
  {
    text: "Love the new dashboard, much faster than before",
    category: "Praise",
    sentiment: "positive",
    priority: "low",
  },
  {
    text: "Export to CSV would save our team hours every week",
    category: "Feature request",
    sentiment: "neutral",
    priority: "medium",
  },
];

function PreviewBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "positive" | "negative" | "neutral" | "high" | "medium" | "low" | "category";
}) {
  const styles = {
    positive: "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/60",
    negative: "bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/60",
    neutral: "bg-stone-100 text-stone-600 ring-stone-200/60 dark:bg-stone-800/50 dark:text-stone-300 dark:ring-stone-700/60",
    high: "bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/60",
    medium: "bg-amber-50 text-amber-800 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/60",
    low: "bg-stone-100 text-stone-600 ring-stone-200/60 dark:bg-stone-800/50 dark:text-stone-300 dark:ring-stone-700/60",
    category: "bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800/60",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />
      <Card className="relative overflow-hidden shadow-none ring-1 ring-border/80">
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="font-sans text-sm font-semibold">
                March support inbox
              </CardTitle>
              <CardDescription>Latest batch · AI analyzed</CardDescription>
            </div>
            <Badge variant="secondary">Live preview</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {previewStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-muted/40 px-3 py-2.5 ring-1 ring-border/50"
              >
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-primary/5 px-3 py-2.5 ring-1 ring-primary/10">
            <p className="text-[10px] font-medium text-primary">AI summary</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              UX friction dominates this batch, with onboarding and navigation cited
              most often. Two high-priority bugs need immediate attention.
            </p>
          </div>

          <div className="space-y-2">
            {previewRows.map((row) => (
              <div
                key={row.text}
                className="rounded-xl border border-border/60 bg-background px-3 py-2.5"
              >
                <p className="line-clamp-1 text-xs text-foreground">{row.text}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <PreviewBadge tone="category">{row.category}</PreviewBadge>
                  <PreviewBadge tone={row.sentiment as "positive" | "negative" | "neutral"}>
                    {row.sentiment}
                  </PreviewBadge>
                  <PreviewBadge tone={row.priority as "high" | "medium" | "low"}>
                    {row.priority}
                  </PreviewBadge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
