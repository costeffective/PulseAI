import { classifyFeedbackBatch } from "@/lib/gemini";
import type { createClient } from "@/lib/supabase/server";
import type { BatchSubmitItem } from "@/lib/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

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
) {
  const rowsWithMetadata = classifiedItems.map((item) => ({
    batch_id: batchId,
    line_index: item.line_index,
    text: item.text,
    category: item.category,
    sentiment: item.sentiment,
    priority: item.priority,
    metadata: sourceItems[item.line_index]?.metadata ?? {},
  }));

  const withMetadata = await supabase
    .from("feedback_items")
    .insert(rowsWithMetadata);

  if (!withMetadata.error) return;

  if (!isMissingMetadataColumn(withMetadata.error.message)) {
    throw new Error(withMetadata.error.message);
  }

  const rowsWithoutMetadata = classifiedItems.map((item) => ({
    batch_id: batchId,
    line_index: item.line_index,
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
