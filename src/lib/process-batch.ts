import {
  classifyFeedbackBatch,
  summarizeClassifiedFeedback,
} from "@/lib/gemini";
import type { createClient } from "@/lib/supabase/server";
import type { BatchSubmitItem } from "@/lib/types";

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

async function refreshBatchSummary(
  supabase: ServerSupabase,
  batchId: string,
) {
  const { data: items, error } = await supabase
    .from("feedback_items")
    .select("text, category, sentiment, priority")
    .eq("batch_id", batchId)
    .order("line_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const summary = await summarizeClassifiedFeedback(items ?? []);

  const { error: updateError } = await supabase
    .from("batches")
    .update({
      summary,
      status: "completed",
    })
    .eq("id", batchId);

  if (updateError) {
    throw new Error(updateError.message);
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
    const result = await classifyFeedbackBatch(items.map((item) => item.text));

    await insertFeedbackItems(supabase, batch.id, result.items, items);

    const { error: updateError } = await supabase
      .from("batches")
      .update({
        summary: result.summary,
        status: "completed",
      })
      .eq("id", batch.id);

    if (updateError) {
      throw new Error(updateError.message);
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
    const result = await classifyFeedbackBatch(items.map((item) => item.text));

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
