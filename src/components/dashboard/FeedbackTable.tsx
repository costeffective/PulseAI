"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { FeedbackDetailSheet } from "@/components/dashboard/FeedbackDetailSheet";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMetadataPreview } from "@/lib/csv";
import {
  categoryBadgeClass,
  priorityBadgeClass,
  sentimentBadgeClass,
} from "@/lib/badge-styles";
import { priorityLabel, sentimentLabel, truncateText } from "@/lib/stats";
import type { FeedbackItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FeedbackTableProps {
  items: FeedbackItem[];
}

function BadgeCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex max-w-full truncate px-3 py-1.5 text-xs ring-1",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function FeedbackTable({ items }: FeedbackTableProps) {
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (item: FeedbackItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No feedback items match this filter.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <CardTitle className="font-sans text-base font-semibold">
            Feedback items
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {items.length} item{items.length === 1 ? "" : "s"} in view · Click a
            row to see full details
          </CardDescription>
        </CardHeader>

        {/* Mobile: stacked cards */}
        <CardContent className="space-y-3 p-4 md:hidden">
          {items.map((item) => {
            const preview = getMetadataPreview(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openDetail(item)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/30",
                  item.priority === "high"
                    ? "border-amber-500/40 bg-amber-500/8 ring-1 ring-amber-500/15"
                    : "border-border/70 bg-card",
                )}
              >
                <p className="font-sans text-sm font-medium leading-6 text-foreground">
                  {truncateText(item.text, 160)}
                </p>
                {preview && (
                  <p className="mt-1.5 font-sans text-xs leading-5 text-muted-foreground">
                    {preview}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <BadgeCell className={categoryBadgeClass(item.category)}>
                    {item.category}
                  </BadgeCell>
                  <BadgeCell className={sentimentBadgeClass(item.sentiment)}>
                    {sentimentLabel(item.sentiment)}
                  </BadgeCell>
                  <BadgeCell className={priorityBadgeClass(item.priority)}>
                    {priorityLabel(item.priority)}
                  </BadgeCell>
                </div>
              </button>
            );
          })}
        </CardContent>

        {/* Desktop: fixed-column table */}
        <CardContent className="hidden p-0 md:block">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-12 w-[44%] px-6 text-sm">
                  Feedback
                </TableHead>
                <TableHead className="h-12 w-[20%] px-4 text-sm">
                  Category
                </TableHead>
                <TableHead className="h-12 w-[14%] px-4 text-sm">
                  Sentiment
                </TableHead>
                <TableHead className="h-12 w-[14%] px-4 text-sm">
                  Priority
                </TableHead>
                <TableHead className="h-12 w-[8%] px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const preview = getMetadataPreview(item);

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "cursor-pointer",
                      item.priority === "high" &&
                        "bg-amber-500/8 hover:bg-amber-500/12",
                    )}
                    onClick={() => openDetail(item)}
                  >
                    <TableCell className="min-w-0 whitespace-normal px-6 py-4 align-top">
                      <p className="line-clamp-2 font-sans text-sm font-medium leading-6 text-foreground/90">
                        {item.text}
                      </p>
                      {preview && (
                        <p className="mt-1.5 truncate font-sans text-xs leading-5 text-muted-foreground">
                          {preview}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 align-middle">
                      <BadgeCell className={categoryBadgeClass(item.category)}>
                        {item.category}
                      </BadgeCell>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 align-middle">
                      <BadgeCell className={sentimentBadgeClass(item.sentiment)}>
                        {sentimentLabel(item.sentiment)}
                      </BadgeCell>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 align-middle">
                      <BadgeCell className={priorityBadgeClass(item.priority)}>
                        {priorityLabel(item.priority)}
                      </BadgeCell>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-4 align-middle text-muted-foreground">
                      <ChevronRight className="size-4" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FeedbackDetailSheet
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
