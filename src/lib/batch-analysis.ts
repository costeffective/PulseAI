import type { BatchAnalysis, FeedbackItem, FeedbackMetadata } from "@/lib/types";

export function collectColumnNames(items: Array<{ metadata: FeedbackMetadata }>) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const [key, value] of Object.entries(item.metadata)) {
      if (!value.trim()) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function buildColumnSamples(
  items: Array<{ metadata: FeedbackMetadata }>,
  columnNames: string[],
  sampleSize = 8,
) {
  const samples: Record<string, string[]> = {};

  for (const column of columnNames) {
    samples[column] = [];
  }

  for (const item of items) {
    for (const column of columnNames) {
      const value = item.metadata[column]?.trim();
      if (!value || samples[column].length >= sampleSize) continue;
      if (!samples[column].includes(value)) {
        samples[column].push(value);
      }
    }
  }

  return samples;
}

export function buildFallbackAnalysis(items: FeedbackItem[]): BatchAnalysis | null {
  if (items.length === 0) return null;

  const highPriorityHighlights = items
    .filter((item) => item.priority === "high")
    .slice(0, 6)
    .map((item) => ({
      text: item.text,
      reason: `${item.category} · ${item.sentiment} sentiment`,
      category: item.category,
      sentiment: item.sentiment,
    }));

  const columnNames = collectColumnNames(items).map((column) => column.name);

  const columns =
    columnNames.length > 0
      ? columnNames.slice(0, 12).map((name) => {
          const values = items
            .map((item) => item.metadata[name])
            .filter((value): value is string => Boolean(value?.trim()));

          const unique = [...new Set(values)];
          const negativeHints = unique.filter((value) =>
            /bad|poor|slow|broken|issue|problem|difficult|frustrat|hate|never|cancel|refund|bug/i.test(
              value,
            ),
          );

          return {
            name,
            summary:
              unique.length <= 3
                ? `Responses include: ${unique.slice(0, 3).join("; ")}.`
                : `${values.length} responses across ${unique.length} distinct answers.`,
            triggerPoints: negativeHints.slice(0, 3),
          };
        })
      : [];

  return {
    overview: `Reviewed ${items.length} responses. ${highPriorityHighlights.length} high-priority item${highPriorityHighlights.length === 1 ? "" : "s"} need attention.`,
    columns,
    highPriorityHighlights,
  };
}

export function normalizeBatchAnalysis(value: unknown): BatchAnalysis | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const overview =
    typeof record.overview === "string" ? record.overview.trim() : "";
  if (!overview) return null;

  const columns = Array.isArray(record.columns)
    ? record.columns
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const column = entry as Record<string, unknown>;
          const name = typeof column.name === "string" ? column.name.trim() : "";
          const summary =
            typeof column.summary === "string" ? column.summary.trim() : "";
          if (!name || !summary) return null;

          const triggerPoints = Array.isArray(column.triggerPoints)
            ? column.triggerPoints
                .filter((point): point is string => typeof point === "string")
                .map((point) => point.trim())
                .filter(Boolean)
                .slice(0, 5)
            : [];

          return { name, summary, triggerPoints };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : [];

  const highPriorityHighlights = Array.isArray(record.highPriorityHighlights)
    ? record.highPriorityHighlights
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const highlight = entry as Record<string, unknown>;
          const text =
            typeof highlight.text === "string" ? highlight.text.trim() : "";
          const reason =
            typeof highlight.reason === "string" ? highlight.reason.trim() : "";
          const category =
            typeof highlight.category === "string"
              ? highlight.category.trim()
              : "Other";
          const sentiment = highlight.sentiment;
          if (!text || !reason) return null;
          if (
            sentiment !== "positive" &&
            sentiment !== "negative" &&
            sentiment !== "neutral"
          ) {
            return null;
          }

          return {
            text,
            reason,
            category,
            sentiment: sentiment as BatchAnalysis["highPriorityHighlights"][number]["sentiment"],
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .slice(0, 8)
    : [];

  return { overview, columns, highPriorityHighlights };
}
