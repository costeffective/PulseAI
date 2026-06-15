"use client";

import { AlertTriangle, Columns3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  categoryBadgeClass,
  priorityBadgeClass,
  sentimentBadgeClass,
} from "@/lib/badge-styles";
import { priorityLabel, sentimentLabel, truncateText } from "@/lib/stats";
import type { BatchAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FeedbackOverviewProps {
  analysis: BatchAnalysis | null;
  status: string;
}

export function FeedbackOverview({ analysis, status }: FeedbackOverviewProps) {
  if (status === "processing" || !analysis) {
    return null;
  }

  const hasColumns = analysis.columns.length > 0;
  const hasHighPriority = analysis.highPriorityHighlights.length > 0;
  const hasTriggers = analysis.columns.some(
    (column) => column.triggerPoints.length > 0,
  );

  if (!hasColumns && !hasHighPriority) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/70 bg-card/90">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <CardTitle className="font-sans text-base font-semibold">
            Feedback overview
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {analysis.overview}
          </CardDescription>
        </CardHeader>

        {hasHighPriority && (
          <CardContent className="space-y-3 border-b border-border/60 px-6 py-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              <h3 className="font-sans text-sm font-semibold text-foreground">
                High priority
              </h3>
            </div>
            <div className="space-y-3">
              {analysis.highPriorityHighlights.map((item) => (
                <div
                  key={`${item.text}-${item.reason}`}
                  className="rounded-xl border-2 border-amber-500/35 bg-amber-500/8 px-4 py-3 ring-1 ring-amber-500/15"
                >
                  <p className="font-sans text-sm font-medium leading-6 text-foreground">
                    {truncateText(item.text, 220)}
                  </p>
                  <p className="mt-2 font-sans text-xs leading-5 text-muted-foreground">
                    {item.reason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn("px-2.5 py-1 text-xs", categoryBadgeClass(item.category))}
                    >
                      {item.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("px-2.5 py-1 text-xs", sentimentBadgeClass(item.sentiment))}
                    >
                      {sentimentLabel(item.sentiment)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("px-2.5 py-1 text-xs", priorityBadgeClass("high"))}
                    >
                      {priorityLabel("high")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}

        {hasColumns && (
          <CardContent className="px-6 py-5">
            <div className="mb-4 flex items-center gap-2">
              <Columns3 className="size-4 text-primary" />
              <h3 className="font-sans text-sm font-semibold text-foreground">
                Column summary
              </h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {analysis.columns.map((column) => (
                <div
                  key={column.name}
                  className="rounded-xl border border-border/70 bg-background/80 px-4 py-4"
                >
                  <p className="font-sans text-sm font-semibold text-foreground">
                    {column.name}
                  </p>
                  <p className="mt-2 font-sans text-sm leading-6 text-muted-foreground">
                    {column.summary}
                  </p>

                  {column.triggerPoints.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="font-sans text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Trigger points
                      </p>
                      <ul className="space-y-1.5">
                        {column.triggerPoints.map((point) => (
                          <li
                            key={point}
                            className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 font-sans text-xs leading-5 text-foreground"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {hasTriggers && (
              <p className="mt-4 font-sans text-xs leading-5 text-muted-foreground">
                Trigger points flag recurring complaints, churn risk, or issues
                that may need immediate follow-up.
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
