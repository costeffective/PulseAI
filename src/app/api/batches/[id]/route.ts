import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackItem, FeedbackMetadata } from "@/lib/types";

const BASE_ITEM_FIELDS =
  "id, batch_id, line_index, text, category, sentiment, priority, created_at";

function isMissingMetadataColumn(message: string) {
  return /metadata/i.test(message) && /column|schema cache/i.test(message);
}

function normalizeMetadata(value: unknown): FeedbackMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, String(entry ?? "").trim()])
      .filter(([, entry]) => entry.length > 0),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("id, user_id, name, summary, status, created_at")
    .eq("id", id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const withMetadata = await supabase
    .from("feedback_items")
    .select(`${BASE_ITEM_FIELDS}, metadata`)
    .eq("batch_id", id)
    .order("line_index", { ascending: true });

  let rawItems: Array<Record<string, unknown>> =
    (withMetadata.data as Array<Record<string, unknown>> | null) ?? [];
  let itemsError = withMetadata.error;

  if (itemsError && isMissingMetadataColumn(itemsError.message)) {
    const withoutMetadata = await supabase
      .from("feedback_items")
      .select(BASE_ITEM_FIELDS)
      .eq("batch_id", id)
      .order("line_index", { ascending: true });

    rawItems =
      (withoutMetadata.data as Array<Record<string, unknown>> | null) ?? [];
    itemsError = withoutMetadata.error;
  }

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const items = rawItems.map((item) => ({
    id: String(item.id),
    batch_id: String(item.batch_id),
    line_index: Number(item.line_index),
    text: String(item.text),
    category: String(item.category),
    sentiment: item.sentiment as FeedbackItem["sentiment"],
    priority: item.priority as FeedbackItem["priority"],
    created_at: String(item.created_at),
    metadata: normalizeMetadata(item.metadata),
  }));

  return NextResponse.json({
    batch: {
      ...batch,
      items,
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
  }

  const { data: batch, error } = await supabase
    .from("batches")
    .update({ name })
    .eq("id", id)
    .select("id, name, created_at, status")
    .single();

  if (error || !batch) {
    return NextResponse.json(
      { error: error?.message ?? "Batch not found" },
      { status: error ? 500 : 404 },
    );
  }

  return NextResponse.json({ batch });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("batches").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
