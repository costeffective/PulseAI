import {
  classifyFeedbackBatch,
  generateBatchAnalysisFromItems,
  summarizeClassifiedFeedback,
} from "@/lib/gemini";
import { buildFallbackAnalysis } from "@/lib/batch-analysis";
import type { createClient } from "@/lib/supabase/server";
import type { BatchSubmitItem, FeedbackItem } from "@/lib/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const MAX_BATCH_SIZE = 200;

function isMissingMetadataColumn(message: string) {
  return /metadata/i.test(message) && /column|schema cache/i.test(message);
}

async function insertFeedbackItems(
  supabase: ServerSupabase,
  batchId: string,
  classifiedItems: Array<{
    line_index: number;
    text: string;
    category: string;
    sentiment: string;
    priority: string;
  }>,
  sourceItems: BatchSubmitItem[],
  lineIndexOffset = 0,
) {
  const rowsWithMetadata = classifiedItems.map((item, index) => ({
    batch_id: batchId,
    line_index: lineIndexOffset + item.line_index,
    text: item.text,
    category: item.category,
    sentiment: item.sentiment,
    priority: item.priority,
    metadata: sourceItems[index]?.metadata ?? {},
  }));

  const withMetadata = await supabase
    .from("feedback_items")
    .insert(rowsWithMetadata);

  if (!withMetadata.error) return;

  if (!isMissingMetadataColumn(withMetadata.error.message)) {
    throw new Error(withMetadata.error.message);
  }

  const rowsWithoutMetadata = classifiedItems.map((item, index) => ({
    batch_id: batchId,
    line_index: lineIndexOffset + item.line_index,
    text: item.text,
    category: item.category,
    sentiment: item.sentiment,
    priority: item.priority,
  }));

  const withoutMetadata = await supabase
    .from("feedback_items")
    .insert(rowsWithoutMetadata);

  if (withoutMetadata.error) {
    throw new Error(withoutMetadata.error.message);
  }
}

function isMissingAnalysisColumn(message: string) {
  return /analysis/i.test(message) && /column|schema cache/i.test(message);
}

async function refreshBatchSummary(
  supabase: ServerSupabase,
  batchId: string,
) {
  const withMetadata = await supabase
    .from("feedback_items")
    .select("text, category, sentiment, priority, metadata")
    .eq("batch_id", batchId)
    .order("line_index", { ascending: true });

  let rawItems = withMetadata.data ?? [];
  let itemsError = withMetadata.error;

  if (itemsError && isMissingMetadataColumn(itemsError.message)) {
    const withoutMetadata = await supabase
      .from("feedback_items")
      .select("text, category, sentiment, priority")
      .eq("batch_id", batchId)
      .order("line_index", { ascending: true });

    rawItems = (withoutMetadata.data ?? []).map((item) => ({
      ...item,
      metadata: {},
    }));
    itemsError = withoutMetadata.error;
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const normalizedItems = rawItems.map((item) => ({
    text: String(item.text),
    category: String(item.category),
    sentiment: String(item.sentiment),
    priority: String(item.priority),
    metadata:
      "metadata" in item &&
      item.metadata &&
      typeof item.metadata === "object" &&
      !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, string>)
        : {},
  }));

  const summary = await summarizeClassifiedFeedback(normalizedItems);

  let analysis = null;
  try {
    analysis = await generateBatchAnalysisFromItems(normalizedItems);
  } catch {
    analysis = buildFallbackAnalysis(
      normalizedItems.map((item, index) => ({
        id: String(index),
        batch_id: batchId,
        line_index: index,
        text: item.text,
        category: item.category,
        sentiment: item.sentiment as FeedbackItem["sentiment"],
        priority: item.priority as FeedbackItem["priority"],
        metadata: item.metadata,
        created_at: new Date().toISOString(),
      })),
    );
  }

  const withAnalysis = await supabase
    .from("batches")
    .update({
      summary,
      analysis,
      status: "completed",
    })
    .eq("id", batchId);

  if (!withAnalysis.error) return;

  if (!isMissingAnalysisColumn(withAnalysis.error.message)) {
    throw new Error(withAnalysis.error.message);
  }

  const withoutAnalysis = await supabase
    .from("batches")
    .update({
      summary,
      status: "completed",
    })
    .eq("id", batchId);

  if (withoutAnalysis.error) {
    throw new Error(withoutAnalysis.error.message);
  }
}

export async function processBatchFromItems(
  supabase: ServerSupabase,
  userId: string,
  items: BatchSubmitItem[],
  batchName: string,
): Promise<{ batchId: string }> {
  if (items.length === 0) {
    throw new Error("At least one feedback item is required");
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .insert({
      user_id: userId,
      name: batchName,
      status: "processing",
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    throw new Error(batchError?.message ?? "Failed to create batch");
  }

  try {
    const result = await classifyFeedbackBatch(items);

    await insertFeedbackItems(supabase, batch.id, result.items, items);

    const withAnalysis = await supabase
      .from("batches")
      .update({
        summary: result.summary,
        analysis: result.analysis,
        status: "completed",
      })
      .eq("id", batch.id);

    if (withAnalysis.error) {
      if (!isMissingAnalysisColumn(withAnalysis.error.message)) {
        throw new Error(withAnalysis.error.message);
      }

      const withoutAnalysis = await supabase
        .from("batches")
        .update({
          summary: result.summary,
          status: "completed",
        })
        .eq("id", batch.id);

      if (withoutAnalysis.error) {
        throw new Error(withoutAnalysis.error.message);
      }
    }

    return { batchId: batch.id };
  } catch (processingError) {
    await supabase
      .from("batches")
      .update({ status: "failed" })
      .eq("id", batch.id);

    throw processingError instanceof Error
      ? processingError
      : new Error("Batch processing failed");
  }
}

export async function appendItemsToBatch(
  supabase: ServerSupabase,
  batchId: string,
  items: BatchSubmitItem[],
): Promise<{ batchId: string; addedCount: number }> {
  if (items.length === 0) {
    throw new Error("At least one feedback item is required");
  }

  const { count: existingCount, error: countError } = await supabase
    .from("feedback_items")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId);

  if (countError) {
    throw new Error(countError.message);
  }

  const totalAfterAppend = (existingCount ?? 0) + items.length;
  if (totalAfterAppend > MAX_BATCH_SIZE) {
    throw new Error(
      `Batch would exceed the ${MAX_BATCH_SIZE} item limit. Sync skipped.`,
    );
  }

  const { data: lastItem, error: lastItemError } = await supabase
    .from("feedback_items")
    .select("line_index")
    .eq("batch_id", batchId)
    .order("line_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastItemError) {
    throw new Error(lastItemError.message);
  }

  const nextLineIndex = (lastItem?.line_index ?? -1) + 1;

  await supabase
    .from("batches")
    .update({ status: "processing" })
    .eq("id", batchId);

  try {
    const result = await classifyFeedbackBatch(items);

    await insertFeedbackItems(
      supabase,
      batchId,
      result.items,
      items,
      nextLineIndex,
    );

    await refreshBatchSummary(supabase, batchId);

    return { batchId, addedCount: items.length };
  } catch (processingError) {
    await supabase
      .from("batches")
      .update({ status: "failed" })
      .eq("id", batchId);

    throw processingError instanceof Error
      ? processingError
      : new Error("Failed to append items to batch");
  }
}
