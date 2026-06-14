export type Sentiment = "positive" | "negative" | "neutral";
export type Priority = "high" | "medium" | "low";

export const CATEGORIES = [
  "Bug",
  "Feature request",
  "Pricing",
  "UX issue",
  "Praise",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type FeedbackMetadata = Record<string, string>;

export interface ParsedFeedbackRow {
  text: string;
  metadata: FeedbackMetadata;
}

export interface FeedbackItem {
  id: string;
  batch_id: string;
  line_index: number;
  text: string;
  category: string;
  sentiment: Sentiment;
  priority: Priority;
  metadata: FeedbackMetadata;
  created_at: string;
}

export interface Batch {
  id: string;
  user_id: string;
  name: string;
  summary: string | null;
  status: "processing" | "completed" | "failed";
  created_at: string;
}

export interface BatchWithItems extends Batch {
  items: FeedbackItem[];
}

export interface BatchListItem {
  id: string;
  name: string;
  created_at: string;
  status: Batch["status"];
}

export interface ClassificationResult {
  index: number;
  category: string;
  sentiment: Sentiment;
  priority: Priority;
}

export interface BatchStats {
  total: number;
  negativePercent: number;
  highPriorityCount: number;
  topTheme: string;
}

export interface BatchSubmitItem {
  text: string;
  metadata?: FeedbackMetadata;
}
