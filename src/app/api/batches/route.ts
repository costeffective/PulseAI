import { NextResponse } from "next/server";
import { classifyFeedbackBatch } from "@/lib/gemini";
import { generateBatchName } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { BatchSubmitItem, FeedbackMetadata } from "@/lib/types";

function normalizeSubmitItems(
  rawItems: Array<string | BatchSubmitItem> | undefined,
): BatchSubmitItem[] {
  return (rawItems ?? [])
    .map((item): BatchSubmitItem | null => {
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { text, metadata: {} } : null;
      }

      const text = item.text?.trim() ?? "";
      if (!text) return null;

      const metadata = Object.fromEntries(
        Object.entries(item.metadata ?? {})
          .map(([key, value]) => [key.trim(), String(value).trim()])
          .filter(([, value]) => value.length > 0),
      );

      return { text, metadata };
    })
    .filter((item): item is BatchSubmitItem => item !== null);
}

function isMissingMetadataColumn(message: string) {
  return /metadata/i.test(message) && /column|schema cache/i.test(message);
}

async function insertFeedbackItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("batches")
    .select("id, name, created_at, status")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ batches: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; items?: Array<string | BatchSubmitItem> };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const items = normalizeSubmitItems(body.items);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "At least one feedback item is required" },
      { status: 400 },
    );
  }

  const batchName = body.name?.trim() || generateBatchName();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .insert({
      user_id: user.id,
      name: batchName,
      status: "processing",
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return NextResponse.json(
      { error: batchError?.message ?? "Failed to create batch" },
      { status: 500 },
    );
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

    return NextResponse.json({ batchId: batch.id });
  } catch (processingError) {
    await supabase
      .from("batches")
      .update({ status: "failed" })
      .eq("id", batch.id);

    const message =
      processingError instanceof Error
        ? processingError.message
        : "Batch processing failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
