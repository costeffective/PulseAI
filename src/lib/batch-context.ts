import type { BatchWithItems, FeedbackItem } from "./types";
import { computeBatchStats } from "./stats";

const MAX_CONTEXT_ITEMS = 80;

function formatMetadata(metadata: FeedbackItem["metadata"]) {
  const entries = Object.entries(metadata ?? {});
  if (entries.length === 0) return "";
  return ` | ${entries.map(([k, v]) => `${k}: ${v}`).join(", ")}`;
}

function formatItemLine(item: FeedbackItem, index: number) {
  const meta = formatMetadata(item.metadata);
  return `${index + 1}. [${item.category} | ${item.sentiment} | ${item.priority}] ${item.text}${meta}`;
}

export function buildBatchChatContext(batch: BatchWithItems) {
  const stats = computeBatchStats(batch.items);
  const categoryBreakdown = Object.entries(
    batch.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `${category}: ${count}`)
    .join(", ");

  const itemsForContext = batch.items.slice(0, MAX_CONTEXT_ITEMS);
  const omittedCount = Math.max(0, batch.items.length - itemsForContext.length);

  const itemLines = itemsForContext.map(formatItemLine).join("\n");

  return `You are Pulse, an AI assistant helping a product ops team analyze customer feedback.

Answer questions using ONLY the batch data below. Be concise, specific, and actionable.
If the data does not support an answer, say so. Reference item numbers when helpful.
Do not invent feedback that is not in the dataset.

BATCH: ${batch.name}
STATUS: ${batch.status}
AI SUMMARY: ${batch.summary ?? "No summary available."}

STATS:
- Total items: ${stats.total}
- Negative sentiment: ${stats.negativePercent}%
- High priority items: ${stats.highPriorityCount}
- Top theme: ${stats.topTheme}
- Category breakdown: ${categoryBreakdown || "n/a"}

FEEDBACK ITEMS:
${itemLines || "No items."}
${omittedCount > 0 ? `\n(${omittedCount} additional items omitted from context for length.)` : ""}`;
}
