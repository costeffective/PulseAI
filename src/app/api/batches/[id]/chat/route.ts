import { NextResponse } from "next/server";
import { normalizeBatchAnalysis } from "@/lib/batch-analysis";
import { fetchBatchRecord } from "@/lib/batch-fetch";
import { buildBatchChatContext } from "@/lib/batch-context";
import { chatAboutBatch, type ChatTurn } from "@/lib/gemini-chat";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackItem } from "@/lib/types";

const BASE_ITEM_FIELDS =
  "id, batch_id, line_index, text, category, sentiment, priority, created_at";

function isMissingMetadataColumn(message: string) {
  return /metadata/i.test(message) && /column|schema cache/i.test(message);
}

function normalizeMetadata(value: unknown): FeedbackItem["metadata"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, String(entry ?? "").trim()])
      .filter(([, entry]) => entry.length > 0),
  );
}

function parseMessages(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw)) return null;

  const messages: ChatTurn[] = [];

  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("role" in entry) ||
      !("content" in entry)
    ) {
      return null;
    }

    const role = (entry as { role: string }).role;
    const content = String((entry as { content: unknown }).content ?? "").trim();

    if (role !== "user" && role !== "assistant") return null;
    if (!content) continue;

    messages.push({ role, content });
  }

  return messages.length > 0 ? messages : null;
}

export async function POST(
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

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "messages must be a non-empty array of { role, content }" },
      { status: 400 },
    );
  }

  const { data: batch, error: batchError } = await fetchBatchRecord(supabase, id);

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

  const items: FeedbackItem[] = rawItems.map((item) => ({
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

  try {
    const systemContext = buildBatchChatContext({
      ...batch,
      analysis: normalizeBatchAnalysis(batch.analysis),
      items,
    });
    const reply = await chatAboutBatch(systemContext, messages);
    return NextResponse.json({ reply });
  } catch (chatError) {
    const message =
      chatError instanceof Error ? chatError.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
