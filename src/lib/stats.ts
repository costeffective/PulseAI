import type { FeedbackItem, Priority, Sentiment } from "./types";

export function computeBatchStats(items: FeedbackItem[]) {
  const total = items.length;

  if (total === 0) {
    return {
      total: 0,
      negativePercent: 0,
      highPriorityCount: 0,
      topTheme: "—",
    };
  }

  const negativeCount = items.filter(
    (item) => item.sentiment === "negative",
  ).length;
  const highPriorityCount = items.filter(
    (item) => item.priority === "high",
  ).length;

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  const topTheme =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return {
    total,
    negativePercent: Math.round((negativeCount / total) * 100),
    highPriorityCount,
    topTheme,
  };
}

export function truncateText(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function getUniqueCategories(items: FeedbackItem[]) {
  return [...new Set(items.map((item) => item.category))].sort();
}

export interface FeedbackItemFilter {
  category: string | null;
  sentiment: Sentiment | null;
  priority: Priority | null;
}

export const EMPTY_ITEM_FILTER: FeedbackItemFilter = {
  category: null,
  sentiment: null,
  priority: null,
};

export function filterByCategory(items: FeedbackItem[], category: string | null) {
  if (!category) return items;
  return items.filter((item) => item.category === category);
}

export function filterFeedbackItems(
  items: FeedbackItem[],
  filter: FeedbackItemFilter,
) {
  return items.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.sentiment && item.sentiment !== filter.sentiment) return false;
    if (filter.priority && item.priority !== filter.priority) return false;
    return true;
  });
}

export function hasActiveFilter(filter: FeedbackItemFilter) {
  return (
    filter.category !== null ||
    filter.sentiment !== null ||
    filter.priority !== null
  );
}

export function formatBatchDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

const batchNameDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function generateBatchName(date: Date = new Date()) {
  return `Batch ${batchNameDateFormatter.format(date)}`;
}

export function formatBatchName(name: string, createdAt: string) {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  return generateBatchName(new Date(createdAt));
}

export function parseFeedbackLines(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function sentimentLabel(sentiment: Sentiment) {
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
}

export function priorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
