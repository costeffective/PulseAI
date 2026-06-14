"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  categoryBadgeClass,
  priorityBadgeClass,
  sentimentBadgeClass,
} from "@/lib/badge-styles";
import { priorityLabel, sentimentLabel } from "@/lib/stats";
import type { FeedbackItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FeedbackDetailSheetProps {
  item: FeedbackItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDetailSheet({
  item,
  open,
  onOpenChange,
}: FeedbackDetailSheetProps) {
  const metadataEntries = item ? Object.entries(item.metadata ?? {}) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <SheetTitle className="font-sans text-lg font-semibold leading-tight">
            Feedback details
          </SheetTitle>
          <SheetDescription className="font-sans text-sm leading-6">
            Full response and fields imported from your upload.
          </SheetDescription>
        </SheetHeader>

        {item ? (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-8">
              <section className="space-y-3">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Classification
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 text-xs ring-1",
                      categoryBadgeClass(item.category),
                    )}
                  >
                    {item.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 text-xs ring-1",
                      sentimentBadgeClass(item.sentiment),
                    )}
                  >
                    {sentimentLabel(item.sentiment)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 text-xs ring-1",
                      priorityBadgeClass(item.priority),
                    )}
                  >
                    {priorityLabel(item.priority)}
                  </Badge>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Feedback
                </p>
                <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
                  <p className="font-sans text-sm leading-7 text-foreground">
                    {item.text}
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Additional details
                </p>

                {metadataEntries.length > 0 ? (
                  <dl className="overflow-hidden rounded-xl border border-border/70 bg-card">
                    {metadataEntries.map(([key, value], index) => (
                      <div
                        key={key}
                        className={cn(
                          "grid gap-1 px-4 py-4 sm:grid-cols-[minmax(120px,140px)_1fr] sm:gap-5",
                          index > 0 && "border-t border-border/60",
                        )}
                      >
                        <dt className="font-sans text-sm font-medium text-muted-foreground">
                          {key}
                        </dt>
                        <dd className="font-sans text-sm leading-6 break-words text-foreground">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
                    <p className="font-sans text-sm leading-6 text-muted-foreground">
                      No extra fields for this item. Upload a CSV or Excel file
                      with columns like Name, Email, or Timestamp to see them
                      here.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-10">
            <p className="font-sans text-sm text-muted-foreground">
              Loading details…
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
