"use client";

import {
  AlertTriangle,
  MessageSquare,
  MessageSquareText,
  Tag,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CHAT_SUGGESTED_PROMPTS } from "@/lib/chat-prompts";
import type { FeedbackItemFilter } from "@/lib/stats";
import type { BatchStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BatchInsightsProps {
  stats: BatchStats;
  summary: string | null;
  status: string;
  itemFilter: FeedbackItemFilter;
  onFilterChange: (filter: FeedbackItemFilter) => void;
  onOpenChat?: () => void;
  onAskPrompt?: (prompt: string) => void;
}

const metricConfig = [
  {
    key: "total",
    label: "Total",
    icon: MessageSquareText,
    tone: "text-primary",
    getValue: (stats: BatchStats) => stats.total.toString(),
    isActive: () => false,
  },
  {
    key: "negative",
    label: "Negative",
    icon: TrendingDown,
    tone: "text-rose-600",
    getValue: (stats: BatchStats) => `${stats.negativePercent}%`,
    isActive: (filter: FeedbackItemFilter) => filter.sentiment === "negative",
  },
  {
    key: "priority",
    label: "High priority",
    icon: AlertTriangle,
    tone: "text-amber-600",
    getValue: (stats: BatchStats) => stats.highPriorityCount.toString(),
    isActive: (filter: FeedbackItemFilter) => filter.priority === "high",
  },
  {
    key: "theme",
    label: "Top theme",
    icon: Tag,
    tone: "text-violet-600",
    getValue: (stats: BatchStats) => stats.topTheme,
    isActive: (filter: FeedbackItemFilter, stats: BatchStats) =>
      stats.topTheme !== "—" && filter.category === stats.topTheme,
  },
] as const;

const quickPrompts = CHAT_SUGGESTED_PROMPTS.slice(0, 2);

export function BatchInsights({
  stats,
  summary,
  status,
  itemFilter,
  onFilterChange,
  onOpenChat,
  onAskPrompt,
}: BatchInsightsProps) {
  const isProcessing = status === "processing";
  const isFailed = status === "failed";
  const canChat = Boolean(onOpenChat) && !isProcessing;

  const summaryText = isFailed
    ? "Summary unavailable — batch processing failed."
    : summary || "No summary available for this batch.";

  const handleMetricClick = (key: (typeof metricConfig)[number]["key"]) => {
    if (key === "total") {
      onFilterChange({ category: null, sentiment: null, priority: null });
      return;
    }

    if (key === "negative") {
      onFilterChange({
        category: null,
        sentiment: itemFilter.sentiment === "negative" ? null : "negative",
        priority: null,
      });
      return;
    }

    if (key === "priority") {
      onFilterChange({
        category: null,
        sentiment: null,
        priority: itemFilter.priority === "high" ? null : "high",
      });
      return;
    }

    if (stats.topTheme === "—") return;

    onFilterChange({
      category:
        itemFilter.category === stats.topTheme ? null : stats.topTheme,
      sentiment: null,
      priority: null,
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card/90 ring-1 ring-foreground/5">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {metricConfig.map((metric) => {
          const active =
            metric.key === "total"
              ? false
              : metric.isActive(itemFilter, stats);

          return (
            <button
              key={metric.key}
              type="button"
              title={
                metric.key === "total"
                  ? "Clear filters"
                  : `Filter by ${metric.label.toLowerCase()}`
              }
              onClick={() => handleMetricClick(metric.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border/70 bg-background hover:border-border hover:bg-muted/50",
              )}
            >
              <metric.icon className={cn("size-3.5 shrink-0", metric.tone)} />
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {metric.getValue(stats)}
              </span>
            </button>
          );
        })}

        {canChat && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-8 gap-1.5 font-sans"
            onClick={onOpenChat}
          >
            <MessageSquare className="size-3.5" />
            Ask AI
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/15 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {isProcessing ? (
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-[88%]" />
            </div>
          ) : (
            <p
              className={cn(
                "min-w-0 flex-1 font-sans text-sm leading-6",
                isFailed ? "text-muted-foreground" : "text-foreground/90",
              )}
            >
              {summaryText}
            </p>
          )}
        </div>

        {canChat && onAskPrompt && (
          <div className="flex shrink-0 flex-wrap gap-1.5 sm:max-w-xs sm:justify-end">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onAskPrompt(prompt)}
                className="rounded-md border border-border/70 bg-background px-2.5 py-1 font-sans text-xs leading-5 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
