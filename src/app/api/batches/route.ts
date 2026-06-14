import { NextResponse } from "next/server";
import { classifyFeedbackBatch } from "@/lib/gemini";
import { processBatchFromItems } from "@/lib/process-batch";
import { generateBatchName } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { BatchSubmitItem } from "@/lib/types";

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

  try {
    const { batchId } = await processBatchFromItems(
      supabase,
      user.id,
      items,
      batchName,
    );

    return NextResponse.json({ batchId });
  } catch (processingError) {
    const message =
      processingError instanceof Error
        ? processingError.message
        : "Batch processing failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
